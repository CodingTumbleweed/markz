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

  // Preserve horizontal position across vertical moves (standard "goal column"
  // behaviour). CM6 stores a goalColumn on the selection; we fall back to the
  // caret's current column when it isn't set. The goal is clamped to the
  // target line's length so shorter lines land at end-of-line, while longer
  // lines snap back to the goal on subsequent moves.
  const currentLine = state.doc.lineAt(head)
  const goalColumn = selection.goalColumn ?? (head - currentLine.from)

  const targetLine = state.doc.lineAt(stops[nextIdx])
  const targetPos = Math.min(targetLine.from + goalColumn, targetLine.to)

  if (targetPos === head && !extend) return false

  const range = extend
    ? EditorSelection.range(selection.anchor, targetPos, goalColumn)
    : EditorSelection.cursor(targetPos, undefined, undefined, goalColumn)

  // Wrap in a full EditorSelection; passing a bare SelectionRange to
  // `view.dispatch` goes through `EditorSelection.single(anchor, head)` in the
  // transaction resolver, which strips the goal-column flag.
  view.dispatch({
    selection: EditorSelection.create([range]),
    effects: EditorView.scrollIntoView(targetPos, { y: 'nearest' }),
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
