/**
 * Line click targeting harness for the welcome document.
 *
 * Validates that clicks on headings/plain lines below block widgets resolve
 * to the correct line (not hidden widget interior lines).
 *
 * happy-dom may not reproduce Electron layout faithfully — these tests are a
 * regression guard using resolveClickPosition logic and coordinate mocks.
 * Manual sign-off in npm run dev is still required.
 *
 * Does not replace test:click (widget API tests).
 *
 * Usage: npm run test:line-click
 */
import { build } from 'esbuild'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, rmSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const entry = resolve(__dirname, '.line-click-test-entry.mjs')
const out = resolve(__dirname, '.line-click-test-run.mjs')

writeFileSync(
  entry,
  `
import { Window } from 'happy-dom'
import { EditorState } from '@codemirror/state'
import { createEditor } from '${root}/src/renderer/editor/setup.ts'
import {
  resolveClickPosition,
  isInteriorHiddenLine,
  getNavigationStops,
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

const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function mockViewForState(state) {
  return {
    state,
    scrollDOM: {
      getBoundingClientRect: () => ({ top: 0 }),
      scrollTop: 0,
    },
    coordsAtPos(pos) {
      const line = state.doc.lineAt(pos)
      const top = line.number * 24
      return { top, bottom: top + 20, left: 0, right: 200 }
    },
    lineBlockAtHeight(docY) {
      const lineNum = Math.min(
        state.doc.lines,
        Math.max(1, Math.floor(docY / 24) + 1),
      )
      const line = state.doc.line(lineNum)
      const top = (lineNum - 1) * 24
      return { from: line.from, to: line.to, top, bottom: top + 20 }
    },
    lineBlockAt(pos) {
      const line = state.doc.lineAt(pos)
      const top = (line.number - 1) * 24
      return { from: line.from, to: line.to, top, bottom: top + 20 }
    },
    posAtCoords({ y }) {
      const lineNum = Math.min(
        state.doc.lines,
        Math.max(1, Math.floor(y / 24) + 1),
      )
      return state.doc.line(lineNum).from
    },
  }
}

function lineNumberForText(doc, needle) {
  const idx = doc.toString().indexOf(needle)
  if (idx < 0) return -1
  return doc.lineAt(idx).number
}

function blockRangeBeforeLine(state, lineNum) {
  const ranges = state.field(blockWidgetRangesField)
  let best = null
  for (const range of ranges) {
    const endLine = state.doc.lineAt(range.to).number
    if (endLine < lineNum) {
      if (!best || endLine > state.doc.lineAt(best.to).number) best = range
    }
  }
  return best
}

function interiorPosInRange(state, range) {
  const startLine = state.doc.lineAt(range.from).number
  return state.doc.line(startLine + 1).from
}

function testSyntheticInteriorLineRemap() {
  const parent = document.createElement('div')
  const view = createEditor(parent)
  const doc = view.state.doc
  const mathLine = lineNumberForText(doc, '## Math')
  const tableRange = blockRangeBeforeLine(view.state, mathLine)
  assert(tableRange != null, 'table widget should precede ## Math')

  const interiorPos = interiorPosInRange(view.state, tableRange)
  assert(
    isInteriorHiddenLine(view.state, interiorPos),
    'table interior line should be hidden',
  )

  const mockView = mockViewForState(view.state)
  const targetY = mockView.coordsAtPos(doc.line(mathLine).from).top + 10
  const resolved = resolveClickPosition(
    view.state,
    interiorPos,
    50,
    targetY,
    mockView,
  )
  assert(
    doc.lineAt(resolved).number === mathLine,
    'interior click aimed at ## Math should remap to Math line',
  )
}

function testWelcomeDocHeadingTargets() {
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  const view = createEditor(parent)
  view.requestMeasure()
  const doc = view.state.doc
  const mockView = mockViewForState(view.state)

  const targets = [
    '## Math',
    '## Extended Syntax',
    '## Diagrams',
    '**Shortcuts:**',
  ]

  for (const needle of targets) {
    const targetLine = lineNumberForText(doc, needle)
    assert(targetLine > 0, 'welcome doc should contain: ' + needle)

    const targetPos = doc.toString().indexOf(needle) + (needle.startsWith('##') ? '## '.length : 2)
    const targetY = mockView.coordsAtPos(targetPos).top + 10

    const blockRange = blockRangeBeforeLine(view.state, targetLine)
    if (blockRange) {
      const interiorPos = interiorPosInRange(view.state, blockRange)
      if (isInteriorHiddenLine(view.state, interiorPos)) {
        const resolved = resolveClickPosition(
          view.state,
          interiorPos,
          50,
          targetY,
          mockView,
        )
        assert(
          doc.lineAt(resolved).number === targetLine,
          needle + ': interior click should remap to line ' + targetLine,
        )
      }
    }

    const stops = getNavigationStops(view.state, view.state.field(blockWidgetRangesField))
    assert(
      stops.includes(doc.line(targetLine).from),
      needle + ': heading line should be a navigation stop',
    )
    assert(
      !isInteriorHiddenLine(view.state, doc.line(targetLine).from),
      needle + ': heading line should not be interior hidden',
    )
  }

  console.log('Welcome heading lines:')
  for (const needle of targets) {
    console.log('  ' + needle + ' -> line ' + lineNumberForText(doc, needle))
  }
}

function testResolveUnchangedOnNormalLine() {
  const parent = document.createElement('div')
  const view = createEditor(parent)
  const doc = view.state.doc
  const mockView = mockViewForState(view.state)
  const welcomePos = doc.toString().indexOf('# Welcome to Markz')
  const y = mockView.coordsAtPos(welcomePos).top + 5
  const resolved = resolveClickPosition(view.state, welcomePos, 50, y, mockView)
  assert(resolved === welcomePos, 'normal line click should not remap')
}

testSyntheticInteriorLineRemap()
testWelcomeDocHeadingTargets()
testResolveUnchangedOnNormalLine()

if (failures.length === 0) {
  console.log('\\nAll line-click tests passed.')
  process.exit(0)
} else {
  console.error('\\nLine-click test failures:')
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
