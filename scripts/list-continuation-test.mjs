/**
 * list-continuation keymap tests (issue #9).
 *
 * Verifies that pressing Enter inside list / blockquote constructs
 *   - inserts the correct next-line prefix
 *   - MOVES THE CARET to the end of that new prefix (the issue-9 fix)
 *   - correctly exits the list when the current item is empty
 *
 * Usage: npm run test:list   (or node scripts/list-continuation-test.mjs)
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.list-continuation-test-entry.mjs')
const out = resolve(__dirname, '.list-continuation-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { EditorState, EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { listContinuation } from '${root}/src/renderer/editor/keymap.ts'

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

function run(label, { doc, selection, expectedDoc, expectedCursor, expectedReturn = true }) {
  const view = makeView(doc, selection)
  const ret = listContinuation(view)
  const resultDoc = view.state.doc.toString()
  const cursor = view.state.selection.main.head
  const docOk = resultDoc === expectedDoc
  const cursorOk = cursor === expectedCursor
  const retOk = ret === expectedReturn
  const ok = docOk && cursorOk && retOk
  if (ok) {
    console.log('PASS ' + label)
  } else {
    console.log('FAIL ' + label)
    if (!docOk)    console.log('  doc expected:    ' + JSON.stringify(expectedDoc) + '  got: ' + JSON.stringify(resultDoc))
    if (!cursorOk) console.log('  cursor expected: ' + expectedCursor + '  got: ' + cursor)
    if (!retOk)    console.log('  return expected: ' + expectedReturn + '  got: ' + ret)
  }
  view.destroy()
  return ok
}

const results = []

// Positions below are measured in post-insert document offsets (0-indexed).
// For continuation branches, cursor = head + insert.length, where insert is
// '\\n' + marker-prefix + ' '  (so 3 chars for '- ', 4 for '2. ', etc).

// ===== Unordered list =====

// The ISSUE-#9 reproducer: pressing Enter at end of '- item one' must
// move the caret down to the new '- ' line.
results.push(run('unordered: enter at end inserts bullet AND moves caret down (issue #9)', {
  doc: '- item one',
  selection: EditorSelection.cursor(10), // after 'one', doc length 10
  expectedDoc: '- item one\\n- ',       // 10 + '\\n- ' (3) = 13
  expectedCursor: 13,                   // end of inserted prefix
}))

results.push(run('unordered: * marker preserved', {
  doc: '* alpha',
  selection: EditorSelection.cursor(7),
  expectedDoc: '* alpha\\n* ',
  expectedCursor: 10,
}))

results.push(run('unordered: indented bullet preserves indent', {
  doc: '  - nested',
  selection: EditorSelection.cursor(10),
  expectedDoc: '  - nested\\n  - ',     // '\\n  - ' is 5 chars
  expectedCursor: 15,
}))

results.push(run('unordered: enter on empty bullet exits list', {
  doc: 'before\\n- \\nafter',           // 6 + 1 + 2 + 1 + 5 = 15 chars
  selection: EditorSelection.cursor(9), // on the '- ' line, after the space
  expectedDoc: 'before\\n\\nafter',     // bullet line cleared
  expectedCursor: 7,                    // line.from of the cleared line
}))

// ===== Ordered list =====

results.push(run('ordered: 1. increments to 2. and moves caret down (issue #9)', {
  doc: '1. first',
  selection: EditorSelection.cursor(8),
  expectedDoc: '1. first\\n2. ',        // '\\n2. ' is 4 chars
  expectedCursor: 12,
}))

results.push(run('ordered: 1) paren delimiter preserved', {
  doc: '1) first',
  selection: EditorSelection.cursor(8),
  expectedDoc: '1) first\\n2) ',
  expectedCursor: 12,
}))

results.push(run('ordered: multi-digit increments 9 -> 10', {
  doc: '9. ninth',
  selection: EditorSelection.cursor(8),
  expectedDoc: '9. ninth\\n10. ',       // '\\n10. ' is 5 chars
  expectedCursor: 13,
}))

results.push(run('ordered: enter on empty "1." exits list', {
  doc: 'top\\n1. \\nend',
  selection: EditorSelection.cursor(7), // on "1. " line, at end of '1. '
  expectedDoc: 'top\\n\\nend',
  expectedCursor: 4,
}))

// ===== Blockquote =====

results.push(run('blockquote: enter continues the "> " prefix and moves caret down', {
  doc: '> quoted',
  selection: EditorSelection.cursor(8),
  expectedDoc: '> quoted\\n> ',         // '\\n> ' is 3 chars
  expectedCursor: 11,
}))

results.push(run('blockquote: enter on lone ">" exits', {
  doc: 'intro\\n>\\nout',
  selection: EditorSelection.cursor(7), // on the ">" line
  expectedDoc: 'intro\\n\\nout',
  expectedCursor: 6,
}))

// ===== Task list =====
// NOTE: The '- [x] foo' continuation code path in listContinuation() is
// currently unreachable because the earlier bullet regex (/^(\\s*)([-*+])\\s/)
// matches '- ' first and returns. These tests pin the CURRENT behaviour so a
// future fix that re-orders the regex checks is forced to update them.

results.push(run('task list: current behaviour -- bullet regex wins, inserts "- " not "- [ ] "', {
  doc: '- [ ] foo',
  selection: EditorSelection.cursor(9),
  expectedDoc: '- [ ] foo\\n- ',
  expectedCursor: 12,
}))

results.push(run('task list: current behaviour -- empty "- [ ]" does NOT exit (bullet wins)', {
  doc: 'x\\n- [ ] \\ny',
  selection: EditorSelection.cursor(8), // end of '- [ ] '
  expectedDoc: 'x\\n- [ ] \\n- \\ny',
  expectedCursor: 11,
}))

// ===== Not a list =====

results.push(run('plain paragraph: handler returns false (defers to default Enter)', {
  doc: 'just a sentence',
  selection: EditorSelection.cursor(15),
  expectedDoc: 'just a sentence', // nothing dispatched
  expectedCursor: 15,
  expectedReturn: false,
}))

// ===== Split mid-item =====

results.push(run('unordered: enter in the MIDDLE of an item splits it, caret after new "- "', {
  doc: '- item one',
  selection: EditorSelection.cursor(7), // between 'item' and ' one'
  expectedDoc: '- item \\n- one',
  expectedCursor: 10,                   // right after '\\n- '
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
