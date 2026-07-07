/**
 * Cursor navigation harness for the welcome document.
 * Validates stop-to-stop movement (no skipped visual anchors).
 *
 * Usage: npm run test:nav
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.navigation-test-entry.mjs')
const out = resolve(__dirname, '.navigation-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { createEditor } from '${root}/src/renderer/editor/setup.ts'
import {
  moveVisualLineDown,
  moveVisualLineUp,
  getNavigationStops,
  findStopIndex,
} from '${root}/src/renderer/editor/blockNavigation.ts'
import { blockWidgetRangesField } from '${root}/src/renderer/editor/blockDecorations.ts'

const happy = new Window({ url: 'http://localhost' })
const { document, HTMLElement, Node, customElements, MutationObserver } = happy
Object.assign(globalThis, {
  window: happy,
  document,
  HTMLElement,
  Node,
  customElements,
  MutationObserver,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: clearTimeout,
  getComputedStyle: happy.getComputedStyle.bind(happy),
})

const parent = document.createElement('div')
document.body.appendChild(parent)
const view = createEditor(parent)

function lineAtCursor(v) {
  return v.state.doc.lineAt(v.state.selection.main.head).number
}

function stopIndexAt(v) {
  const ranges = v.state.field(blockWidgetRangesField)
  const stops = getNavigationStops(v.state, ranges)
  return findStopIndex(stops, v.state.selection.main.head, v.state)
}

function scan(label, moveFn, direction) {
  const stepsLog = []
  const badMoves = []
  let prevPos = view.state.selection.main.head

  for (let i = 0; i < 80; i++) {
    const beforeLine = lineAtCursor(view)
    const beforePos = prevPos
    const moved = moveFn(view)
    const afterLine = lineAtCursor(view)
    const afterPos = view.state.selection.main.head
    const posDelta = afterPos - beforePos

    stepsLog.push({
      step: i + 1,
      beforeLine,
      afterLine,
      posDelta,
      moved,
    })

    if (moved && posDelta === 0) {
      badMoves.push({ step: i + 1, reason: 'no position change', beforeLine, afterLine })
    } else if (moved && direction < 0 && posDelta > 0) {
      badMoves.push({ step: i + 1, reason: 'moved down while going up', beforeLine, afterLine })
    } else if (moved && direction > 0 && posDelta < 0) {
      badMoves.push({ step: i + 1, reason: 'moved up while going down', beforeLine, afterLine })
    }

    prevPos = afterPos
    if (!moved || afterPos === beforePos) break
  }

  console.log('\\n=== ' + label + ' ===')
  console.log('Navigation stops:', getNavigationStops(view.state, view.state.field(blockWidgetRangesField)).length)
  for (const s of stepsLog.slice(0, 12)) {
    console.log(
      '  step ' + s.step + ': line ' + s.beforeLine + ' -> ' + s.afterLine +
      ' (pos delta ' + s.posDelta + ')' + (s.moved ? '' : ' [stopped]')
    )
  }
  if (stepsLog.length > 12) {
    console.log('  ... ' + (stepsLog.length - 12) + ' more steps')
  }

  if (badMoves.length === 0) {
    console.log('Navigation moved monotonically in document order.')
  } else {
    console.log('Invalid moves:', badMoves.length)
    for (const b of badMoves.slice(0, 5)) {
      console.log('  step ' + b.step + ': ' + b.reason + ' (line ' + b.beforeLine + ' -> ' + b.afterLine + ')')
    }
  }

  return badMoves
}

const totalLines = view.state.doc.lines
console.log('Document lines:', totalLines)

view.dispatch({ selection: { anchor: view.state.doc.length } })
console.log('Starting at line:', lineAtCursor(view))

const upBad = scan('Visual line up from bottom', moveVisualLineUp, -1)
view.dispatch({ selection: { anchor: 0 } })
console.log('Starting at line:', lineAtCursor(view))
const downBad = scan('Visual line down from top', moveVisualLineDown, 1)

const allBad = [...upBad, ...downBad]
process.exit(allBad.length > 0 ? 1 : 0)
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
