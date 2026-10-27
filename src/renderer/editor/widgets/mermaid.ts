import { WidgetType, EditorView } from '@codemirror/view'
import mermaid from 'mermaid'

let mermaidInitialized = false
let idCounter = 0

function ensureInit() {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
    // 'loose' is required to enable htmlLabels for flowchart (used below),
    // which fixes label clipping by allowing text to wrap inside nodes.
    // Markz renders only user-authored local markdown, so this is acceptable.
    securityLevel: 'loose',
    fontFamily: 'inherit',
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      padding: 15,
      nodeSpacing: 50,
      rankSpacing: 55,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      wrap: true,
    },
    class: { useMaxWidth: true },
    state: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
    er: { useMaxWidth: true },
    journey: { useMaxWidth: true },
    pie: { useMaxWidth: true },
  })
  mermaidInitialized = true
}

const MIN_SCALE = 0.25
const MAX_SCALE = 4
const SCALE_STEP = 1.2
// Re-render through Mermaid when the container width changes by more than
// this fraction. Smaller changes rely on CSS/viewBox scaling, which avoids
// the cost (and flicker) of re-rendering on every resize tick.
const RERENDER_WIDTH_THRESHOLD = 0.25

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

    const viewport = document.createElement('div')
    viewport.className = 'markz-mermaid-viewport'
    wrapper.appendChild(viewport)

    const controls = createZoomControls()
    wrapper.appendChild(controls.element)

    ensureInit()
    const id = `markz-mermaid-${idCounter++}`

    // Zoom / pan state. Persists across CodeMirror widget-reuse because eq()
    // returns true when source is unchanged (so toDOM isn't re-invoked).
    let scale = 1
    let panX = 0
    let panY = 0

    const applyTransform = () => {
      const svg = viewport.querySelector('svg') as SVGElement | null
      if (!svg) return
      svg.style.transformOrigin = '0 0'
      svg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`
      const zoomed = scale > 1.001
      wrapper.classList.toggle('is-zoomed', zoomed)
      controls.updateLabel(scale)
    }

    const setScale = (next: number) => {
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next))
      if (Math.abs(scale - 1) < 1e-3) {
        // Snap pan back to origin when returning to 1x so content re-centers.
        panX = 0
        panY = 0
      }
      applyTransform()
    }

    const resetZoom = () => {
      scale = 1
      panX = 0
      panY = 0
      applyTransform()
    }

    controls.onZoomIn(() => setScale(scale * SCALE_STEP))
    controls.onZoomOut(() => setScale(scale / SCALE_STEP))
    controls.onReset(resetZoom)

    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, this.source)
        viewport.innerHTML = svg
        const el = viewport.querySelector('svg') as SVGElement | null
        if (el) {
          // Let the viewBox handle aspect ratio and let CSS stretch width to
          // the container. This is what makes the diagram grow when the
          // window is widened.
          el.removeAttribute('width')
          el.removeAttribute('height')
          el.style.width = '100%'
          el.style.height = 'auto'
          el.style.maxWidth = '100%'
          applyTransform()
        }
      } catch (err: any) {
        viewport.innerHTML = `<div class="markz-mermaid-error">Diagram error: ${err?.message || err}</div>`
      }
    }

    render()

    // ---- Resize-driven re-render (debounced, threshold-gated) ----
    let lastRenderWidth = 0
    let resizeTimer: number | undefined
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w <= 0) return
      if (!lastRenderWidth) {
        lastRenderWidth = w
        return
      }
      const delta = Math.abs(w - lastRenderWidth) / lastRenderWidth
      if (delta < RERENDER_WIDTH_THRESHOLD) return
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        lastRenderWidth = w
        render()
      }, 150)
    })
    ro.observe(wrapper)

    // ---- Click to position cursor in source (only when not zoomed) ----
    wrapper.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('.markz-mermaid-controls')) return
      if (scale > 1.001) return // zoomed: let drag-to-pan handle it
      e.preventDefault()
      view.dispatch({ selection: { anchor: this.from } })
      view.focus()
    })

    // ---- Ctrl/Cmd + wheel to zoom ----
    wrapper.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? SCALE_STEP : 1 / SCALE_STEP
      setScale(scale * factor)
    }, { passive: false })

    // ---- Drag-to-pan when zoomed in ----
    let dragStart: { x: number; y: number; panX: number; panY: number } | null = null
    viewport.addEventListener('pointerdown', (e) => {
      if (scale <= 1.001) return
      if ((e.target as HTMLElement).closest('.markz-mermaid-controls')) return
      dragStart = { x: e.clientX, y: e.clientY, panX, panY }
      viewport.setPointerCapture(e.pointerId)
      viewport.classList.add('is-panning')
      e.preventDefault()
    })
    viewport.addEventListener('pointermove', (e) => {
      if (!dragStart) return
      panX = dragStart.panX + (e.clientX - dragStart.x)
      panY = dragStart.panY + (e.clientY - dragStart.y)
      applyTransform()
    })
    const endDrag = (e: PointerEvent) => {
      if (!dragStart) return
      dragStart = null
      try { viewport.releasePointerCapture(e.pointerId) } catch { /* no-op */ }
      viewport.classList.remove('is-panning')
    }
    viewport.addEventListener('pointerup', endDrag)
    viewport.addEventListener('pointercancel', endDrag)

    // ---- Context menu (existing export options) ----
    wrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const svg = viewport.querySelector('svg')
      if (!svg) return
      showDiagramContextMenu(e, svg as SVGElement)
    })

    return wrapper
  }

  ignoreEvent(event: Event): boolean {
    return !/^mouse|^click|^context/.test(event.type)
  }
}

interface ZoomControls {
  element: HTMLElement
  onZoomIn: (cb: () => void) => void
  onZoomOut: (cb: () => void) => void
  onReset: (cb: () => void) => void
  updateLabel: (scale: number) => void
}

function createZoomControls(): ZoomControls {
  const el = document.createElement('div')
  el.className = 'markz-mermaid-controls'

  const makeBtn = (label: string, title: string) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'markz-mermaid-ctrl-btn'
    b.textContent = label
    b.title = title
    // Prevent the wrapper's mousedown handler (which moves the editor cursor)
    // from firing when a control is clicked.
    b.addEventListener('mousedown', (e) => e.stopPropagation())
    return b
  }

  const zoomOut = makeBtn('−', 'Zoom out')
  const zoomIn = makeBtn('+', 'Zoom in')
  const reset = makeBtn('⟲', 'Reset zoom')

  const scaleLabel = document.createElement('span')
  scaleLabel.className = 'markz-mermaid-scale'
  scaleLabel.textContent = '100%'

  el.append(zoomOut, scaleLabel, zoomIn, reset)

  return {
    element: el,
    onZoomIn: (cb) => zoomIn.addEventListener('click', cb),
    onZoomOut: (cb) => zoomOut.addEventListener('click', cb),
    onReset: (cb) => reset.addEventListener('click', cb),
    updateLabel: (s) => {
      scaleLabel.textContent = `${Math.round(s * 100)}%`
    },
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
