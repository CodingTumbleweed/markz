import { WidgetType, EditorView } from '@codemirror/view'

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
