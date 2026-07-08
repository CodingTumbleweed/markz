import { WidgetType, EditorView } from '@codemirror/view'
import hljs from 'highlight.js'
import { attachBlockWidgetClick } from '../enterBlockWidget'
import { scheduleEditorMeasure } from '../measure'

export class CodeBlockWidget extends WidgetType {
  constructor(
    readonly code: string,
    readonly language: string,
    readonly from: number,
    readonly to: number
  ) {
    super()
  }

  eq(other: CodeBlockWidget): boolean {
    return this.code === other.code && this.language === other.language
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'markz-code-block'

    const header = document.createElement('div')
    header.className = 'markz-code-header'
    header.textContent = this.language || 'plain text'
    wrapper.appendChild(header)

    const pre = document.createElement('pre')
    const code = document.createElement('code')

    if (this.language && hljs.getLanguage(this.language)) {
      try {
        code.innerHTML = hljs.highlight(this.code, { language: this.language }).value
      } catch {
        code.textContent = this.code
      }
    } else {
      code.textContent = this.code
    }

    pre.appendChild(code)
    wrapper.appendChild(pre)

    attachBlockWidgetClick(wrapper, view, this.from, this.to)
    scheduleEditorMeasure(view)

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click/.test(event.type)
  }
}
