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
    const singleLine = /^\$\$([^\n$]+)\$\$$/.exec(text)
    if (singleLine) {
      return from + text.indexOf(singleLine[1])
    }
    const newline = text.indexOf('\n')
    return newline >= 0 ? from + newline + 1 : from + 2
  }
  return from
}

function focusWidgetAt(view: EditorView, pos: number): void {
  view.dispatch({
    selection: EditorSelection.cursor(pos),
    scrollIntoView: false,
  })
  view.focus()
  requestAnimationFrame(() => {
    view.dispatch({
      effects: EditorView.scrollIntoView(pos, { y: 'center' }),
    })
  })
}

export function enterBlockWidget(view: EditorView, from: number, to?: number): void {
  const cursorPos = to != null
    ? contentStartInBlock(view.state.doc, from, to)
    : from
  focusWidgetAt(view, cursorPos)
}

export function enterInlineMathWidget(view: EditorView, from: number, _to: number): void {
  focusWidgetAt(view, from + 1)
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
