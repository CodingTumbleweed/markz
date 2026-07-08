import { EditorView } from '@codemirror/view'

export function scheduleEditorMeasure(view: EditorView): void {
  requestAnimationFrame(() => {
    view.requestMeasure()
  })
}
