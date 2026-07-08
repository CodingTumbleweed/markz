/**
 * Click-to-edit harness for block and inline math widgets.
 *
 * Baseline (welcome doc):
 * - Block math: cursor on first LaTeX line inside $$
 * - Inline math: cursor after opening $ (not on delimiter)
 *
 * Does not validate line clicks on headings/plain text — see test:line-click.
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.click-edit-test-entry.mjs')
const out = resolve(__dirname, '.click-edit-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { EditorState } from '@codemirror/state'
import { createEditor } from '${root}/src/renderer/editor/setup.ts'
import {
  contentStartInBlock,
  enterBlockWidget,
  enterInlineMathWidget,
} from '${root}/src/renderer/editor/enterBlockWidget.ts'
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

const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function testContentStartInBlock() {
  const cases = [
    {
      label: 'multiline block math',
      doc: "$$\\nfrac{a}{b}\\n$$",
      from: 0,
      expected: 3,
      expectedChar: 'f',
    },
    {
      label: 'single-line block math',
      doc: '$$x^2$$',
      from: 0,
      expected: 2,
      expectedChar: 'x',
    },
    {
      label: 'fenced code block',
      doc: '~~~js\\ncode\\n~~~',
      from: 0,
      expected: 6,
      expectedChar: 'c',
    },
  ]

  for (const c of cases) {
    const state = EditorState.create({ doc: c.doc })
    const to = c.doc.length
    const pos = contentStartInBlock(state.doc, c.from, to)
    assert(pos === c.expected, c.label + ': expected pos ' + c.expected + ', got ' + pos)
    assert(
      state.doc.sliceString(pos, pos + 1) === c.expectedChar,
      c.label + ': expected char ' + c.expectedChar + ' at pos',
    )
  }
}

function testWelcomeDocClickEdit() {
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  const view = createEditor(parent)
  const doc = view.state.doc
  const text = doc.toString()

  const eMc2Literal = '$E = mc^2$'
  const eMc2From = text.indexOf(eMc2Literal)
  const eMc2To = eMc2From + eMc2Literal.length
  assert(eMc2From >= 0, 'welcome doc should contain $E = mc^2$')

  const integralMarker = '$\\\\int_0'
  const integralFrom = text.indexOf(integralMarker)
  assert(integralFrom >= 0, 'welcome doc should contain integral inline math')
  const integralEnd = text.indexOf('$', integralFrom + 1) + 1
  const integralTo = integralEnd

  enterInlineMathWidget(view, eMc2From, eMc2To)
  assert(
    view.state.selection.main.head === eMc2From + 1,
    'inline E=mc^2: cursor should be after opening $, got head ' + view.state.selection.main.head,
  )
  assert(
    doc.sliceString(eMc2From + 1, eMc2From + 2) === 'E',
    'inline E=mc^2: cursor should be on E',
  )

  enterInlineMathWidget(view, integralFrom, integralTo)
  assert(
    view.state.selection.main.head === integralFrom + 1,
    'inline integral: cursor should be after opening $, got head ' + view.state.selection.main.head,
  )

  const widgetRanges = view.state.field(blockWidgetRangesField)
  const blockMath = widgetRanges.find((r) => doc.sliceString(r.from, r.from + 2) === '$$')
  assert(blockMath != null, 'welcome doc should have a block math widget range')

  const expectedBlockPos = contentStartInBlock(doc, blockMath.from, blockMath.to)
  enterBlockWidget(view, blockMath.from, blockMath.to)
  assert(
    view.state.selection.main.head === expectedBlockPos,
    'block math: cursor should be at content start ' + expectedBlockPos +
    ', got ' + view.state.selection.main.head,
  )
  const blockLine = doc.lineAt(expectedBlockPos).text.trim()
  assert(
    blockLine.includes('frac'),
    'block math: cursor should be on LaTeX line, got: ' + blockLine,
  )

  console.log('Welcome doc offsets:')
  console.log('  inline E=mc^2:', eMc2From, '-', eMc2To, '-> head', eMc2From + 1)
  console.log('  inline integral:', integralFrom, '-', integralTo, '-> head', integralFrom + 1)
  console.log('  block math:', blockMath.from, '-', blockMath.to, '-> head', expectedBlockPos)
}

testContentStartInBlock()
testWelcomeDocClickEdit()

if (failures.length === 0) {
  console.log('\\nAll click-to-edit tests passed.')
  process.exit(0)
} else {
  console.error('\\nClick-to-edit test failures:')
  for (const f of failures) console.error('  -', f)
  process.exit(1)
}
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
