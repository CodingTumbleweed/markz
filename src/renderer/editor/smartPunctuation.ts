import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'

function isWordChar(c: string): boolean {
  return /\w/.test(c)
}

export const smartPunctuation = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      // no-op — all logic is in the inputHandler
    }
  },
)

export const smartPunctuationInputHandler = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (from !== to) return false

    const doc = view.state.doc
    const before = from > 0 ? doc.sliceString(from - 1, from) : ''

    // Smart double quotes
    if (text === '"') {
      const isOpenQuote = from === 0 || /[\s(\[{]/.test(before)
      const curly = isOpenQuote ? '\u201C' : '\u201D'
      view.dispatch({
        changes: { from, to, insert: curly },
        selection: EditorSelection.cursor(from + curly.length),
      })
      return true
    }

    // Smart single quotes
    if (text === "'") {
      const isOpenQuote = from === 0 || /[\s(\[{]/.test(before)
      const curly = isOpenQuote ? '\u2018' : '\u2019'
      view.dispatch({
        changes: { from, to, insert: curly },
        selection: EditorSelection.cursor(from + curly.length),
      })
      return true
    }

    // Em-dash: -- -> —
    if (text === '-' && before === '-') {
      const twoBefore = from > 1 ? doc.sliceString(from - 2, from - 1) : ''
      if (twoBefore !== '-') {
        view.dispatch({
          changes: { from: from - 1, to, insert: '\u2014' },
          selection: EditorSelection.cursor(from),
        })
        return true
      }
    }

    // Ellipsis: ... -> …
    if (text === '.' && from >= 2) {
      const prev2 = doc.sliceString(from - 2, from)
      if (prev2 === '..') {
        view.dispatch({
          changes: { from: from - 2, to, insert: '\u2026' },
          selection: EditorSelection.cursor(from - 1),
        })
        return true
      }
    }

    return false
  },
)
