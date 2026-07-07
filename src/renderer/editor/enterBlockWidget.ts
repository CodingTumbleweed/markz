import { EditorSelection } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import type { Text } from '@codemirror/state'

export function contentStartInBlock(doc: Text, from: number, to: number): number {
  const text = doc.sliceString(from, to)
  if (text.startsWith('```') || text.startsWith('~~~')) {
    const newline = text.indexOf('\n')
    return newline >= 0 ? from + newline + 1 : from
  }
  if (text.startsWith('$$')) {
    const newline = text.indexOf('\n')
    return newline >= 0 ? from + newline + 1 : from + 2
  }
  return from
}

export function enterBlockWidget(view: EditorView, from: number, to?: number): void {
  const cursorPos = to != null
    ? contentStartInBlock(view.state.doc, from, to)
    : from
  view.dispatch({
    selection: EditorSelection.cursor(cursorPos),
    effects: EditorView.scrollIntoView(cursorPos, { y: 'center' }),
  })
  view.focus()
}

export function attachBlockWidgetClick(
  element: HTMLElement,
  view: EditorView,
  from: number,
  to?: number,
): void {
  element.addEventListener('mousedown', (e) => {
    e.preventDefault()
    enterBlockWidget(view, from, to)
  })
}
