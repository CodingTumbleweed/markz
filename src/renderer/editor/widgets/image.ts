import { WidgetType, EditorView } from '@codemirror/view'
import { attachBlockWidgetClick } from '../enterBlockWidget'

export class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
    readonly from: number
  ) {
    super()
  }

  eq(other: ImageWidget): boolean {
    return this.src === other.src && this.alt === other.alt
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'markz-image-wrapper'

    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.title = this.alt
    img.className = 'markz-image'

    img.onerror = () => {
      wrapper.classList.add('markz-image-error')
      wrapper.textContent = `⚠ Image not found: ${this.src}`
    }

    wrapper.appendChild(img)

    attachBlockWidgetClick(wrapper, view, this.from)

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click/.test(event.type)
  }
}
