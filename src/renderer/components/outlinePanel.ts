import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'

export interface OutlineItem {
  level: number
  text: string
  pos: number
}

export function extractOutline(text: string): OutlineItem[] {
  const items: OutlineItem[] = []
  const lines = text.split('\n')
  let offset = 0

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      items.push({
        level: match[1].length,
        text: match[2].replace(/\s*#+\s*$/, ''),
        pos: offset,
      })
    }
    offset += line.length + 1
  }

  return items
}

export function createOutlinePanel(parent: HTMLElement): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'markz-outline-panel'
  panel.id = 'outline-panel'
  panel.innerHTML = '<div class="markz-outline-header">Outline</div><div class="markz-outline-list" id="outline-list"></div>'
  parent.insertBefore(panel, parent.firstChild)
  return panel
}

export function updateOutlinePanel(items: OutlineItem[], view: EditorView): void {
  const list = document.getElementById('outline-list')
  if (!list) return

  list.innerHTML = ''

  if (items.length === 0) {
    list.innerHTML = '<div class="markz-outline-empty">No headings</div>'
    return
  }

  for (const item of items) {
    const el = document.createElement('div')
    el.className = `markz-outline-item markz-outline-level-${item.level}`
    el.textContent = item.text
    el.addEventListener('click', () => {
      view.dispatch({
        selection: { anchor: item.pos },
        scrollIntoView: true,
      })
      view.focus()
    })
    list.appendChild(el)
  }
}

export const outlinePlugin = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      this.refresh(view)
    }
    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.refresh(update.view)
      }
    }
    refresh(view: EditorView) {
      const items = extractOutline(view.state.doc.toString())
      updateOutlinePanel(items, view)
    }
  }
)
