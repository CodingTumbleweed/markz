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

/** Interior lines of inactive block widgets (hidden source lines). */
export function getSkippedInteriorLineNumbers(
  state: EditorState,
  ranges: BlockWidgetRange[],
): Set<number> {
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

  return skipLineNumbers
}

export function isInteriorHiddenLine(
  state: EditorState,
  pos: number,
  ranges?: BlockWidgetRange[],
): boolean {
  const lineNum = state.doc.lineAt(pos).number
  const widgetRanges = ranges ?? state.field(blockWidgetRangesField)
  return getSkippedInteriorLineNumbers(state, widgetRanges).has(lineNum)
}

function isInactiveBlockFirstLine(
  state: EditorState,
  pos: number,
  ranges: BlockWidgetRange[],
): boolean {
  const active = getActiveLineRange(state)
  const lineNum = state.doc.lineAt(pos).number
  for (const range of ranges) {
    if (rangeOverlaps(range.from, range.to, active.from, active.to)) continue
    if (state.doc.lineAt(range.from).number === lineNum) return true
  }
  return false
}

export function nearestStopByY(view: EditorView, stops: number[], clientY: number): number {
  if (stops.length === 0) return 0
  let best = stops[0]
  let bestDist = Infinity
  for (const stop of stops) {
    const coords = view.coordsAtPos(stop)
    if (!coords) continue
    const mid = (coords.top + coords.bottom) / 2
    const dist = Math.abs(clientY - mid)
    if (dist < bestDist) {
      bestDist = dist
      best = stop
    }
  }
  return best
}

/**
 * Remap click when posAtCoords lands inside an inactive block but the visual
 * line at the click Y is elsewhere (common below rendered widgets).
 */
export function resolveClickPosition(
  state: EditorState,
  pos: number,
  clientX: number,
  clientY: number,
  view: EditorView,
): number {
  const ranges = state.field(blockWidgetRangesField)
  const stops = getNavigationStops(state, ranges)

  if (isInteriorHiddenLine(state, pos, ranges)) {
    return nearestStopByY(view, stops, clientY)
  }

  const active = getActiveLineRange(state)
  for (const range of ranges) {
    if (rangeOverlaps(range.from, range.to, active.from, active.to)) continue
    if (pos < range.from || pos > range.to) continue

    try {
      const scroller = view.scrollDOM
      const docY = clientY - scroller.getBoundingClientRect().top + scroller.scrollTop
      const visualFrom = view.lineBlockAtHeight(docY).from
      const visualLine = state.doc.lineAt(visualFrom).number
      const posLine = state.doc.lineAt(pos).number
      if (visualLine !== posLine && !isInteriorHiddenLine(state, visualFrom)) {
        const refined = view.posAtCoords({ x: clientX, y: clientY, side: 1 })
        if (
          refined != null
          && state.doc.lineAt(refined).number === visualLine
          && !isInteriorHiddenLine(state, refined)
        ) {
          return refined
        }
        return visualFrom
      }
    } catch {
      // fall through
    }
  }

  if (isInactiveBlockFirstLine(state, pos, ranges)) {
    try {
      const lineBlock = view.lineBlockAt(pos)
      if (clientY > lineBlock.bottom - 2) {
        return nearestStopByY(view, stops, clientY)
      }
    } catch {
      // fall through
    }
  }

  return pos
}

/** Document positions where Arrow Up/Down may land (skips hidden widget interior lines). */
export function getNavigationStops(
  state: EditorState,
  ranges: BlockWidgetRange[],
): number[] {
  const skipped = getSkippedInteriorLineNumbers(state, ranges)
  const stops: number[] = []
  for (let line = 1; line <= state.doc.lines; line++) {
    if (skipped.has(line)) continue
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
