/**
 * Arrow-key goal-column tests.
 *
 * Covers goal-column preservation on ArrowUp / ArrowDown:
 *   - end-of-line goal clamps to end of a shorter target line
 *   - column goal preserved into a longer target line
 *   - goal column survives passing through a shorter intermediate line
 *   - works symmetrically for Up and Down
 *   - selection extension (shift) also carries the goal column
 *
 * Usage: npm run test:nav-column   (or node scripts/block-navigation-test.mjs)
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.block-navigation-test-entry.mjs')
const out = resolve(__dirname, '.block-navigation-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { EditorState, EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import {
  moveVisualLineUp,
  moveVisualLineDown,
  selectVisualLineDown,
} from '${root}/src/renderer/editor/blockNavigation.ts'
import { blockDecorations, blockWidgetRangesField } from '${root}/src/renderer/editor/blockDecorations.ts'

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
  // blockDecorations wires up blockWidgetRangesField; with a plain doc
  // (no fenced code / math / mermaid / tables) the widget range list stays
  // empty, so every line is a navigation stop.
  const state = EditorState.create({
    doc,
    selection,
    extensions: [blockDecorations, blockWidgetRangesField],
  })
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  return new EditorView({ state, parent })
}

function colOf(view) {
  const sel = view.state.selection.main
  const line = view.state.doc.lineAt(sel.head)
  return sel.head - line.from
}

function lineOf(view) {
  return view.state.doc.lineAt(view.state.selection.main.head).number
}

function run(label, { doc, startSelection, actions, expected }) {
  const view = makeView(doc, startSelection)
  for (const action of actions) action(view)
  const sel = view.state.selection.main
  const result = {
    head: sel.head,
    anchor: sel.anchor,
    line: lineOf(view),
    column: colOf(view),
    goalColumn: sel.goalColumn,
  }
  const ok = Object.keys(expected).every((k) => result[k] === expected[k])
  if (ok) {
    console.log('PASS ' + label)
  } else {
    console.log('FAIL ' + label)
    for (const k of Object.keys(expected)) {
      if (result[k] !== expected[k]) {
        console.log('  ' + k + ' expected ' + expected[k] + ' got ' + result[k])
      }
    }
  }
  view.destroy()
  return ok
}

const results = []

// Doc layout (offsets in parentheses):
//   Line 1: '- item one'        (0..10,  length 10)
//   newline                     (10)
//   Line 2: '- two'              (11..16, length 5)
//   newline                     (16)
//   Line 3: '- item three long' (17..34, length 17)
const listDoc = '- item one\\n- two\\n- item three long'

// Primary issue: cursor at end of 'item one' -> Down -> end of '- two'.
// Before the fix this landed at column 0 of line 2 ('- '). After the fix
// it clamps to end of the shorter target line, with goalColumn=10 preserved.
results.push(run('end of long line -> Down -> end of shorter line', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(10),
  actions: [moveVisualLineDown],
  expected: { line: 2, column: 5, goalColumn: 10 },
}))

// Pressing Down twice should snap BACK to column 10 on the long line 3.
results.push(run('goal column survives a shorter intermediate line', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(10),
  actions: [moveVisualLineDown, moveVisualLineDown],
  expected: { line: 3, column: 10, goalColumn: 10 },
}))

// Mid-line goal preserved when both lines are long enough.
results.push(run('column 4 on line 1 -> Down -> column 4 on line 3 (long enough)', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(4),
  // one Down lands col-4 on line 2 (short, fits), then col-4 on line 3
  actions: [moveVisualLineDown, moveVisualLineDown],
  expected: { line: 3, column: 4, goalColumn: 4 },
}))

// Start-of-line goal (column 0) still works.
results.push(run('column 0 -> Down -> column 0 on next line', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(0),
  actions: [moveVisualLineDown],
  expected: { line: 2, column: 0, goalColumn: 0 },
}))

// Up is symmetric.
results.push(run('end of short line -> Up -> same column on longer previous line', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(16), // end of line 2
  actions: [moveVisualLineUp],
  expected: { line: 1, column: 5, goalColumn: 5 },
}))

// Shift+Down extends the selection and still preserves the goal column.
results.push(run('shift+Down extends selection with goal column preserved', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(10),
  actions: [selectVisualLineDown],
  expected: { anchor: 10, head: 16, line: 2, column: 5, goalColumn: 10 },
}))

// Down at the very last line is a no-op.
results.push(run('Down at last line is a no-op', {
  doc: listDoc,
  startSelection: EditorSelection.cursor(listDoc.length),
  actions: [moveVisualLineDown],
  expected: { head: listDoc.length, line: 3 },
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
