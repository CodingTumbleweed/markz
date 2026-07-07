import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { blockWidgetRangesField, type BlockWidgetRange } from './blockDecorations'

function getActiveLineRange(state: EditorState): { from: number; to: number } {
  const sel = state.selection.main
  return {
    from: state.doc.lineAt(sel.from).from,
    to: state.doc.lineAt(sel.to).to,
  }
}

function rangeOverlaps(
  aFrom: number,
  aTo: number,
  bFrom: number,
  bTo: number,
): boolean {
  return aFrom < bTo && aTo > bFrom
}

/** Document positions where Arrow Up/Down may land (skips hidden widget interior lines). */
export function getNavigationStops(
  state: EditorState,
  ranges: BlockWidgetRange[],
): number[] {
  const active = getActiveLineRange(state)
  const skipLineNumbers = new Set<number>()

  for (const range of ranges) {
    if (rangeOverlaps(range.from, range.to, active.from, active.to)) continue
    const startLine = state.doc.lineAt(range.from).number
    const endLine = state.doc.lineAt(range.to).number
    for (let line = startLine + 1; line <= endLine; line++) {
      skipLineNumbers.add(line)
    }
  }

  const stops: number[] = []
  for (let line = 1; line <= state.doc.lines; line++) {
    if (skipLineNumbers.has(line)) continue
    stops.push(state.doc.line(line).from)
  }
  return stops
}

export function findStopIndex(stops: number[], head: number, state: EditorState): number {
  const line = state.doc.lineAt(head)
  const exact = stops.indexOf(line.from)
  if (exact >= 0) return exact

  for (let i = 0; i < stops.length; i++) {
    const stopLine = state.doc.lineAt(stops[i])
    if (head >= stops[i] && head <= stopLine.to) return i
  }

  for (let i = stops.length - 1; i >= 0; i--) {
    if (stops[i] <= head) return i
  }
  return 0
}

function moveByStop(view: EditorView, direction: -1 | 1, extend: boolean): boolean {
  const { state } = view
  const ranges = state.field(blockWidgetRangesField)
  const stops = getNavigationStops(state, ranges)
  if (stops.length === 0) return false

  const selection = state.selection.main
  const head = selection.head
  const idx = findStopIndex(stops, head, state)
  const nextIdx = idx + direction
  if (nextIdx < 0 || nextIdx >= stops.length) return false

  const pos = stops[nextIdx]
  if (pos === head && !extend) return false
  const newSelection = extend
    ? EditorSelection.range(selection.anchor, pos)
    : EditorSelection.cursor(pos)

  view.dispatch({
    selection: newSelection,
    effects: EditorView.scrollIntoView(pos, { y: 'nearest' }),
  })
  return true
}

export function moveVisualLineUp(view: EditorView): boolean {
  return moveByStop(view, -1, false)
}

export function moveVisualLineDown(view: EditorView): boolean {
  return moveByStop(view, 1, false)
}

export function selectVisualLineUp(view: EditorView): boolean {
  return moveByStop(view, -1, true)
}

export function selectVisualLineDown(view: EditorView): boolean {
  return moveByStop(view, 1, true)
}
