import { WidgetType, EditorView } from '@codemirror/view'
import katex from 'katex'
import { attachBlockWidgetClick } from '../enterBlockWidget'

export class BlockMathWidget extends WidgetType {
  constructor(
    readonly latex: string,
    readonly from: number,
    readonly to: number
  ) {
    super()
  }

  eq(other: BlockMathWidget): boolean {
    return this.latex === other.latex
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'markz-math-block'

    try {
      katex.render(this.latex, wrapper, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#c00',
        trust: true,
        strict: false,
      })
    } catch {
      wrapper.textContent = this.latex
      wrapper.classList.add('markz-math-error')
    }

    attachBlockWidgetClick(wrapper, view, this.from, this.to)

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click/.test(event.type)
  }
}

export function renderInlineMath(latex: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'markz-math-inline'

  try {
    katex.render(latex, span, {
      displayMode: false,
      throwOnError: false,
      errorColor: '#c00',
      trust: true,
      strict: false,
    })
  } catch {
    span.textContent = `$${latex}$`
    span.classList.add('markz-math-error')
  }

  return span
}
