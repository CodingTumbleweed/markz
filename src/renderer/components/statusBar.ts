import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

export function createStatusBar(parent: HTMLElement): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'markz-status-bar'

  bar.innerHTML = `
    <span class="markz-status-file" id="status-file">Untitled</span>
    <span class="markz-status-spacer"></span>
    <span class="markz-status-item" id="status-reading"></span>
    <span class="markz-status-item" id="status-words">0 words</span>
    <span class="markz-status-item" id="status-chars">0 chars</span>
    <span class="markz-status-item" id="status-doc-lines">0 lines</span>
    <span class="markz-status-item" id="status-lines">Ln 1, Col 1</span>
  `

  parent.appendChild(bar)
  return bar
}

export const statusBarPlugin = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      this.updateStatus(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.updateStatus(update.view)
      }
    }

    updateStatus(view: EditorView) {
      const doc = view.state.doc
      const text = doc.toString()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.length
      const totalLines = doc.lines
      const pos = view.state.selection.main.head
      const line = doc.lineAt(pos)
      const col = pos - line.from + 1
      const readingMinutes = Math.max(1, Math.ceil(words / 200))

      const wordsEl = document.getElementById('status-words')
      const charsEl = document.getElementById('status-chars')
      const linesEl = document.getElementById('status-lines')
      const docLinesEl = document.getElementById('status-doc-lines')
      const readingEl = document.getElementById('status-reading')

      if (wordsEl) wordsEl.textContent = `${words} word${words !== 1 ? 's' : ''}`
      if (charsEl) charsEl.textContent = `${chars} chars`
      if (docLinesEl) docLinesEl.textContent = `${totalLines} line${totalLines !== 1 ? 's' : ''}`
      if (linesEl) linesEl.textContent = `Ln ${line.number}, Col ${col}`
      if (readingEl) readingEl.textContent = `~${readingMinutes} min read`
    }
  }
)

export function updateFileStatus(name: string, modified: boolean): void {
  const el = document.getElementById('status-file')
  if (el) el.textContent = modified ? `${name} •` : name
}
