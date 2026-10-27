/**
 * Toggle-wrap keymap tests (issue #8).
 * Exercises wrapSelection() for the key cases:
 *   - plain wrap (no existing markers)
 *   - toggle off via selection-includes-markers (pre-existing behavior)
 *   - toggle off via markers-outside-selection (the bug this fixes)
 *   - toggle off via empty cursor inside markers
 *   - italic correctly disambiguated from bold (`*` vs `**`)
 *
 * Usage: npm run test:wrap   (or node scripts/wrap-selection-test.mjs)
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.wrap-selection-test-entry.mjs')
const out = resolve(__dirname, '.wrap-selection-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { EditorState, EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { wrapSelection } from '${root}/src/renderer/editor/keymap.ts'

const happy = new Window({ url: 'http://localhost' })
Object.assign(globalThis, {
  window: happy,
  document: happy.document,
  HTMLElement: happy.HTMLElement,
  Node: happy.Node,
  customElements: happy.customElements,
  MutationObserver: happy.MutationObserver,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: clearTimeout,
  getComputedStyle: happy.getComputedStyle.bind(happy),
})

function makeView(doc, selection) {
  const state = EditorState.create({ doc, selection })
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  return new EditorView({ state, parent })
}

function run(label, { doc, selection, before, after, expectedDoc, expectedSelection }) {
  const view = makeView(doc, selection)
  wrapSelection(view, before, after)
  const resultDoc = view.state.doc.toString()
  const main = view.state.selection.main
  const resultSel = { anchor: main.anchor, head: main.head }
  const docOk = resultDoc === expectedDoc
  const selOk =
    resultSel.anchor === expectedSelection.anchor &&
    resultSel.head === expectedSelection.head
  const ok = docOk && selOk
  if (ok) {
    console.log('PASS ' + label)
  } else {
    console.log('FAIL ' + label)
    if (!docOk) console.log('  doc expected: ' + JSON.stringify(expectedDoc) + '  got: ' + JSON.stringify(resultDoc))
    if (!selOk) console.log('  sel expected: ' + JSON.stringify(expectedSelection) + '  got: ' + JSON.stringify(resultSel))
  }
  view.destroy()
  return ok
}

const results = []

// --- Case 1: plain wrap (existing behavior)
results.push(run('cmd+b wraps a plain selection', {
  doc: 'hello world',
  selection: EditorSelection.range(0, 5), // "hello"
  before: '**', after: '**',
  expectedDoc: '**hello** world',
  expectedSelection: { anchor: 2, head: 7 },
}))

// --- Case 1 toggle: markers inside selection
results.push(run('cmd+b unwraps when markers are inside selection', {
  doc: '**hello** world',
  selection: EditorSelection.range(0, 9), // "**hello**"
  before: '**', after: '**',
  expectedDoc: 'hello world',
  expectedSelection: { anchor: 0, head: 5 },
}))

// --- Case 2 toggle: markers outside selection (THE BUG from issue #8)
results.push(run('cmd+b unwraps when markers hug the selection (issue #8)', {
  doc: '**hello** world',
  selection: EditorSelection.range(2, 7), // "hello" with ** on both sides
  before: '**', after: '**',
  expectedDoc: 'hello world',
  expectedSelection: { anchor: 0, head: 5 },
}))

// --- Case 3 toggle: empty cursor inside markers on same line
results.push(run('cmd+b unwraps when cursor sits inside markers (empty selection)', {
  doc: '**hello** world',
  selection: EditorSelection.cursor(5), // "**hel|lo**"
  before: '**', after: '**',
  expectedDoc: 'hello world',
  expectedSelection: { anchor: 3, head: 3 },
}))

// --- Italic plain wrap
results.push(run('cmd+i wraps a plain selection', {
  doc: 'hello world',
  selection: EditorSelection.range(0, 5),
  before: '*', after: '*',
  expectedDoc: '*hello* world',
  expectedSelection: { anchor: 1, head: 6 },
}))

// --- Italic toggle off, markers outside
results.push(run('cmd+i unwraps italic when markers hug selection', {
  doc: '*hello* world',
  selection: EditorSelection.range(1, 6),
  before: '*', after: '*',
  expectedDoc: 'hello world',
  expectedSelection: { anchor: 0, head: 5 },
}))

// --- CRITICAL: cmd+i inside bold must NOT strip bold markers
results.push(run('cmd+i inside **bold** does not strip bold markers, wraps instead', {
  doc: '**bold** world',
  selection: EditorSelection.range(2, 6), // "bold" with ** on both sides
  before: '*', after: '*',
  expectedDoc: '***bold*** world',
  expectedSelection: { anchor: 3, head: 7 },
}))

// --- Strikethrough toggle off, markers outside
results.push(run('cmd+shift+x unwraps strikethrough', {
  doc: '~~gone~~ world',
  selection: EditorSelection.range(2, 6),
  before: '~~', after: '~~',
  expectedDoc: 'gone world',
  expectedSelection: { anchor: 0, head: 4 },
}))

// --- Inline code toggle off
results.push(run('backtick toggle off strips inline code', {
  doc: '\`code\` here',
  selection: EditorSelection.range(1, 5),
  before: '\`', after: '\`',
  expectedDoc: 'code here',
  expectedSelection: { anchor: 0, head: 4 },
}))

// --- No markers found: wrap empty selection -> inserts empty markers
results.push(run('cmd+b with empty selection and no surrounding markers inserts markers', {
  doc: 'hello',
  selection: EditorSelection.cursor(5),
  before: '**', after: '**',
  expectedDoc: 'hello****',
  expectedSelection: { anchor: 7, head: 7 },
}))

const failed = results.filter((r) => !r).length
console.log('\\n' + (results.length - failed) + '/' + results.length + ' passed')
process.exit(failed > 0 ? 1 : 0)
`,
)

await build({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  alias: {
    '@shared': resolve(root, 'src/shared'),
  },
  logLevel: 'silent',
})

const child = spawn(process.execPath, [out], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('close', (code) => {
  if (existsSync(out)) rmSync(out)
  if (existsSync(entry)) rmSync(entry)
  process.exit(code ?? 1)
})
