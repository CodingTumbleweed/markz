export function initZoom() {
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      if (e.deltaY < 0) window.electronAPI.zoomIn()
      else if (e.deltaY > 0) window.electronAPI.zoomOut()
    }
  }, { passive: false })
}
