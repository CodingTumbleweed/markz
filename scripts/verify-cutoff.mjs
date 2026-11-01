/**
 * Headless-Chrome regression test for the "last line clipped" bug.
 *
 * Builds a stand-alone HTML that:
 *   - loads src/renderer/base.css
 *   - creates a real EditorView with the project's createEditorExtensions
 *   - renders a long doc inside a container with the real chrome layout
 *     (titlebar + tabbar + statusbar as flex siblings of .cm-editor)
 *
 * Then asserts, after scrolling to the end of the document:
 *   - the status bar's bottom is at (or within 1px of) the viewport bottom
 *   - the editor's bottom + status bar height stays within the viewport
 *   - the last line's bottom is above the scroller's bottom (not clipped)
 *
 * Prints PASS/FAIL and exits non-zero on failure. Also writes a screenshot
 * to scripts/.cutoff/screenshot.png so a human can eyeball the bottom edge.
 *
 * Usage: npm run test:layout   (or node scripts/verify-cutoff.mjs)
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(__dirname, '.cutoff')
mkdirSync(outDir, { recursive: true })

// Bundle a browser-side script that mounts the real editor.
const srcEntry = resolve(outDir, 'entry.mjs')
writeFileSync(
  srcEntry,
  `
import { EditorView } from '@codemirror/view'
import { createEditorState, welcomeDoc } from '${root}/src/renderer/editor/setup.ts'

// A doc long enough to need scrolling in a 600px tall viewport.
const longDoc = welcomeDoc + '\\n\\n' + Array.from({ length: 30 }, (_, i) =>
  '## Section ' + (i + 1) + '\\n\\nLorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\\n'
).join('\\n') + '\\n\\n**End-of-document marker:** LAST LINE SHOULD BE VISIBLE'

const editorRoot = document.getElementById('editor-root')
const titlebar = document.createElement('div')
titlebar.className = 'markz-titlebar'
titlebar.style.display = 'block' // force on, no platform-darwin class
editorRoot.appendChild(titlebar)

const tabbar = document.createElement('div')
tabbar.className = 'markz-tab-bar'
editorRoot.appendChild(tabbar)

const view = new EditorView({
  state: createEditorState(longDoc),
  parent: editorRoot,
})

const statusbar = document.createElement('div')
statusbar.className = 'markz-status-bar'
statusbar.textContent = 'status bar'
editorRoot.appendChild(statusbar)

// Scroll to the bottom so we see the "last line" area.
const scroller = view.scrollDOM
scroller.scrollTop = scroller.scrollHeight

// Expose measurements for the Node side.
window.__diag = () => {
  const rect = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, bottom: r.bottom }
  }
  const cs = (el) => {
    const s = getComputedStyle(el)
    return {
      padding: s.padding, paddingTop: s.paddingTop, paddingBottom: s.paddingBottom,
      height: s.height, minHeight: s.minHeight,
      display: s.display, overflowY: s.overflowY,
    }
  }
  const editor = document.querySelector('.cm-editor')
  const scroller = document.querySelector('.cm-scroller')
  const content = document.querySelector('.cm-content')
  const lines = document.querySelectorAll('.cm-line')
  const lastLine = lines[lines.length - 1]
  const status = document.querySelector('.markz-status-bar')
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    editor: { rect: rect(editor), style: cs(editor) },
    scroller: {
      rect: rect(scroller),
      style: cs(scroller),
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
      scrollTop: scroller.scrollTop,
      scrollTopMax: scroller.scrollHeight - scroller.clientHeight,
    },
    content: {
      rect: rect(content),
      style: cs(content),
      lineCount: lines.length,
    },
    lastLine: {
      text: lastLine?.textContent?.slice(0, 60),
      rect: lastLine ? rect(lastLine) : null,
    },
    statusbar: { rect: rect(status), style: cs(status) },
  }
}
console.log('ready')
`,
)

await build({
  entryPoints: [srcEntry],
  outfile: resolve(outDir, 'bundle.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  globalName: 'MarkzDiag',
  alias: { '@shared': resolve(root, 'src/shared') },
  loader: { '.ts': 'ts' },
  logLevel: 'error',
})

// Build CSS by reading base.css + katex (optional). We only need base.css here.
const css = readFileSync(resolve(root, 'src/renderer/base.css'), 'utf8')
writeFileSync(resolve(outDir, 'base.css'), css)

// A fake electronAPI the renderer touches.
const html = `<!DOCTYPE html>
<html lang="en" class="platform-darwin">
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="base.css" />
  <style>html, body { height: 100vh; margin: 0; }</style>
</head>
<body>
  <div id="editor-root" role="main"></div>
  <script>
    window.electronAPI = {
      getConfig: () => Promise.resolve({ appearance: {}, general: {} }),
      setConfig: () => Promise.resolve(),
    }
  </script>
  <script src="bundle.js"></script>
</body>
</html>`
const htmlPath = resolve(outDir, 'index.html')
writeFileSync(htmlPath, html)

// Launch headless Chrome: pass a page.evaluate via --headless + a user script
// is tricky; use the remote-debugging-port approach via a tiny Node script.
import { WebSocket } from 'ws'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9333
const proc = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1200,700',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${resolve(outDir, 'profile')}`,
  'file://' + htmlPath,
], { stdio: 'ignore' })

// Poll for devtools to listen (previous fixed-sleep approach was flaky
// on busy machines or when Chrome was still cleaning up a stale
// user-data-dir from an earlier aborted run).
async function waitForDevtools(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`)
      if (res.ok) return res.json()
    } catch {}
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Chrome devtools did not come up on port ${port} within ${timeoutMs}ms`)
}

async function cdp() {
  const list = await waitForDevtools()
  const target = list.find((t) => t.type === 'page')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.on('open', r))
  let id = 0
  const pending = new Map()
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString())
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id
    pending.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params }))
  })
  return { send, close: () => ws.close() }
}

try {
  const { send, close } = await cdp()
  await send('Page.enable')
  await send('Runtime.enable')
  // Wait a beat for the page scripts to run.
  await new Promise((r) => setTimeout(r, 2000))

  const diag = await send('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__diag())',
    returnByValue: true,
  })
  const info = JSON.parse(diag.result.value)

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(resolve(outDir, 'screenshot.png'), Buffer.from(shot.data, 'base64'))
  close()

  // --- Assertions --------------------------------------------------------
  const v = info.viewport.h
  const checks = [
    [
      'status bar aligns with viewport bottom',
      Math.abs(info.statusbar.rect.bottom - v) <= 1,
      `statusbar.bottom=${info.statusbar.rect.bottom.toFixed(1)}, viewport.h=${v}`,
    ],
    [
      'editor + status bar fit in viewport (no flex overflow)',
      info.editor.rect.bottom + info.statusbar.rect.h <= v + 1,
      `editor.bottom=${info.editor.rect.bottom.toFixed(1)}, statusbar.h=${info.statusbar.rect.h.toFixed(1)}, viewport.h=${v}`,
    ],
    [
      'last line of document fits inside scroller viewport',
      info.lastLine && info.lastLine.rect.bottom <= info.scroller.rect.bottom,
      info.lastLine
        ? `lastLine.bottom=${info.lastLine.rect.bottom.toFixed(1)}, scroller.bottom=${info.scroller.rect.bottom.toFixed(1)}`
        : 'no last line found',
    ],
    [
      'scrolled position reached the end',
      info.scroller.scrollTop === info.scroller.scrollTopMax,
      `scrollTop=${info.scroller.scrollTop}, scrollTopMax=${info.scroller.scrollTopMax}`,
    ],
  ]

  let failed = 0
  for (const [label, ok, detail] of checks) {
    if (ok) {
      console.log('PASS ' + label)
    } else {
      failed++
      console.log('FAIL ' + label)
      console.log('  ' + detail)
    }
  }
  console.log(`\n${checks.length - failed}/${checks.length} passed`)
  console.log('Screenshot: ' + resolve(outDir, 'screenshot.png'))
  if (failed > 0) {
    console.log('\nFull diagnostic:')
    console.log(JSON.stringify(info, null, 2))
  }
  process.exit(failed > 0 ? 1 : 0)
} finally {
  proc.kill()
}
