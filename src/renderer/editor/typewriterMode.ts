import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { StateField, StateEffect } from '@codemirror/state'

export const toggleTypewriterMode = StateEffect.define<boolean>()

export const typewriterModeState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const e of tr.effects) {
      if (e.is(toggleTypewriterMode)) return e.value
    }
    return value
  },
})

export const typewriterPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (!update.state.field(typewriterModeState)) return
      if (!update.selectionSet && !update.docChanged) return

      const view = update.view
      const head = view.state.selection.main.head
      const coords = view.coordsAtPos(head)
      if (!coords) return

      const scroller = view.scrollDOM
      const scrollerRect = scroller.getBoundingClientRect()
      const targetY = scrollerRect.top + scrollerRect.height / 2

      const currentY = coords.top
      const delta = currentY - targetY

      if (Math.abs(delta) > 4) {
        scroller.scrollTop += delta
      }
    }
  },
)
