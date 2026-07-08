import { WidgetType, EditorView } from '@codemirror/view'

export class TableWidget extends WidgetType {
  constructor(
    readonly rows: string[][],
    readonly alignments: ('left' | 'center' | 'right' | null)[],
    readonly from: number,
    readonly to: number
  ) {
    super()
  }

  eq(other: TableWidget): boolean {
    return JSON.stringify(this.rows) === JSON.stringify(other.rows)
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'markz-table-wrapper'

    const table = document.createElement('table')
    table.className = 'markz-table'

    if (this.rows.length > 0) {
      const thead = document.createElement('thead')
      const headerRow = document.createElement('tr')
      for (let i = 0; i < this.rows[0].length; i++) {
        const th = document.createElement('th')
        th.textContent = this.rows[0][i]?.trim() || ''
        if (this.alignments[i]) {
          th.style.textAlign = this.alignments[i]!
        }
        headerRow.appendChild(th)
      }
      thead.appendChild(headerRow)
      table.appendChild(thead)
    }

    if (this.rows.length > 1) {
      const tbody = document.createElement('tbody')
      for (let r = 1; r < this.rows.length; r++) {
        const tr = document.createElement('tr')
        for (let c = 0; c < this.rows[r].length; c++) {
          const td = document.createElement('td')
          td.textContent = this.rows[r][c]?.trim() || ''
          if (this.alignments[c]) {
            td.style.textAlign = this.alignments[c]!
          }
          tr.appendChild(td)
        }
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
    }

    wrapper.appendChild(table)

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault()
      view.dispatch({ selection: { anchor: this.from } })
      view.focus()
    })

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click/.test(event.type)
  }
}

export function parseTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

export function parseAlignments(line: string): ('left' | 'center' | 'right' | null)[] {
  return parseTableRow(line).map((cell) => {
    const trimmed = cell.replace(/\s/g, '')
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
    if (trimmed.endsWith(':')) return 'right'
    if (trimmed.startsWith(':')) return 'left'
    return null
  })
}
