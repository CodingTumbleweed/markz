import { WidgetType, EditorView } from '@codemirror/view'
import mermaid from 'mermaid'

let mermaidInitialized = false
let idCounter = 0

function ensureInit() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    securityLevel: 'strict',
    fontFamily: 'inherit',
  })
  mermaidInitialized = true
}

export class MermaidWidget extends WidgetType {
  constructor(
    readonly source: string,
    readonly from: number,
    readonly to: number,
  ) {
    super()
  }

  eq(other: MermaidWidget): boolean {
    return this.source === other.source
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'markz-mermaid-block'

    ensureInit()
    const id = `markz-mermaid-${idCounter++}`

    mermaid.render(id, this.source).then(({ svg }) => {
      wrapper.innerHTML = svg
      wrapper.querySelector('svg')?.setAttribute('style', 'max-width:100%;height:auto;')
    }).catch((err) => {
      wrapper.innerHTML = `<div class="markz-mermaid-error">Diagram error: ${err.message || err}</div>`
    })

    wrapper.addEventListener('mousedown', (e) => {
      e.preventDefault()
      view.dispatch({ selection: { anchor: this.from } })
      view.focus()
    })

    wrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const svg = wrapper.querySelector('svg')
      if (!svg) return
      showDiagramContextMenu(e, svg)
    })

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click|^context/.test(event.type)
  }
}

function showDiagramContextMenu(e: MouseEvent, svg: SVGElement) {
  document.querySelectorAll('.markz-context-menu').forEach((m) => m.remove())

  const menu = document.createElement('div')
  menu.className = 'markz-context-menu'
  menu.style.left = `${e.clientX}px`
  menu.style.top = `${e.clientY}px`

  const items = [
    {
      label: 'Copy as SVG',
      action: () => {
        const svgData = new XMLSerializer().serializeToString(svg)
        navigator.clipboard.writeText(svgData)
      },
    },
    {
      label: 'Copy as PNG',
      action: () => copyAsPng(svg),
    },
    {
      label: 'Save as SVG…',
      action: () => saveSvg(svg),
    },
    {
      label: 'Save as PNG…',
      action: () => savePng(svg),
    },
  ]

  for (const item of items) {
    const el = document.createElement('div')
    el.className = 'markz-context-item'
    el.textContent = item.label
    el.addEventListener('click', () => {
      menu.remove()
      item.action()
    })
    menu.appendChild(el)
  }

  document.body.appendChild(menu)
  const dismiss = (ev: MouseEvent) => {
    if (!menu.contains(ev.target as Node)) {
      menu.remove()
      document.removeEventListener('click', dismiss)
    }
  }
  setTimeout(() => document.addEventListener('click', dismiss), 0)
}

function svgToCanvas(svg: SVGElement): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = url
  })
}

async function copyAsPng(svg: SVGElement) {
  try {
    const canvas = await svgToCanvas(svg)
    canvas.toBlob(async (blob) => {
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      }
    })
  } catch (err) {
    console.error('Failed to copy as PNG:', err)
  }
}

async function saveSvg(svg: SVGElement) {
  const svgData = new XMLSerializer().serializeToString(svg)
  const result = await window.electronAPI.saveFileAs(svgData)
  if (result) console.log('SVG saved to', result)
}

async function savePng(svg: SVGElement) {
  try {
    const canvas = await svgToCanvas(svg)
    const dataUrl = canvas.toDataURL('image/png')
    const binary = atob(dataUrl.split(',')[1])
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
    const blob = new Blob([array], { type: 'image/png' })
    const text = await blob.text()
    const result = await window.electronAPI.saveFileAs(text)
    if (result) console.log('PNG saved to', result)
  } catch (err) {
    console.error('Failed to save PNG:', err)
  }
}
