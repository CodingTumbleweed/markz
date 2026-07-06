import { Decoration, DecorationSet } from '@codemirror/view'
import { EditorState, StateField, StateEffect, Range } from '@codemirror/state'
import { EditorView } from '@codemirror/view'

export const toggleFocusMode = StateEffect.define<boolean>()

export const focusModeState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(toggleFocusMode)) return e.value
    }
    return value
  },
})

const dimLine = Decoration.line({ class: 'markz-focus-dim' })

function getActiveBlockRange(state: EditorState): { from: number; to: number } {
  const cursor = state.selection.main.head
  const doc = state.doc
  const curLine = doc.lineAt(cursor)

  let blockStart = curLine.number
  let blockEnd = curLine.number

  while (blockStart > 1) {
    const prev = doc.line(blockStart - 1)
    if (prev.text.trim() === '') break
    blockStart--
  }

  while (blockEnd < doc.lines) {
    const next = doc.line(blockEnd + 1)
    if (next.text.trim() === '') break
    blockEnd++
  }

  return {
    from: doc.line(blockStart).from,
    to: doc.line(blockEnd).to,
  }
}

function buildFocusDecorations(state: EditorState): DecorationSet {
  if (!state.field(focusModeState)) return Decoration.none

  const { from: blockFrom, to: blockTo } = getActiveBlockRange(state)
  const decos: Range<Decoration>[] = []
  const doc = state.doc

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    if (line.from < blockFrom || line.from > blockTo) {
      decos.push(dimLine.range(line.from))
    }
  }

  return Decoration.set(decos)
}

export const focusModeDecorations = StateField.define<DecorationSet>({
  create(state) {
    return buildFocusDecorations(state)
  },
  update(decos, tr) {
    if (tr.docChanged || tr.selection || tr.effects.some((e) => e.is(toggleFocusMode))) {
      return buildFocusDecorations(tr.state)
    }
    return decos
  },
  provide(field) {
    return EditorView.decorations.from(field)
  },
})
