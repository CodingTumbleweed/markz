import type { SearchMatch } from '../../shared/types'

type ResultCallback = (match: SearchMatch) => void
type RootGetter = () => string | null

let overlay: HTMLElement | null = null
let selectedIndex = 0
let results: SearchMatch[] = []
let searchTimer: ReturnType<typeof setTimeout> | null = null
let onResult: ResultCallback = () => {}
let getRoot: RootGetter = () => null

export function setGlobalSearchCallbacks(cb: ResultCallback, rootGetter: RootGetter) {
  onResult = cb
  getRoot = rootGetter
}

function relativePath(filePath: string, root: string): string {
  if (filePath.startsWith(root)) {
    return filePath.slice(root.length + 1)
  }
  return filePath
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderList(root: string | null, query: string) {
  if (!overlay) return

  const list = overlay.querySelector('.markz-search-list') as HTMLElement
  const hint = overlay.querySelector('.markz-search-hint') as HTMLElement

  if (!root) {
    hint.textContent = 'Open a folder to search the workspace.'
    hint.style.display = 'block'
    list.innerHTML = ''
    results = []
    return
  }

  hint.style.display = 'none'
  list.innerHTML = ''

  if (!query.trim()) {
    results = []
    return
  }

  selectedIndex = Math.min(selectedIndex, results.length - 1)
  if (selectedIndex < 0) selectedIndex = 0

  results.forEach((r, i) => {
    const item = document.createElement('div')
    item.className = 'markz-quick-item markz-search-item' + (i === selectedIndex ? ' selected' : '')
    const rel = relativePath(r.filePath, root)
    item.innerHTML =
      `<span class="markz-search-location">${escapeHtml(rel)}:${r.line}</span>` +
      `<span class="markz-search-preview">${escapeHtml(r.preview)}</span>`

    item.addEventListener('click', () => {
      close()
      onResult(r)
    })
    item.addEventListener('mouseenter', () => {
      selectedIndex = i
      list.querySelectorAll('.markz-search-item').forEach((el, idx) => {
        el.classList.toggle('selected', idx === i)
      })
    })
    list.appendChild(item)
  })
}

async function runSearch(query: string) {
  const root = getRoot()
  if (!root || !query.trim()) {
    results = []
    renderList(root, query)
    return
  }

  try {
    results = await window.electronAPI.searchWorkspace(root, query)
  } catch {
    results = []
  }
  selectedIndex = 0
  renderList(root, query)
}

function scheduleSearch(query: string) {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void runSearch(query)
  }, 200)
}

export function openGlobalSearch() {
  if (overlay) {
    close()
    return
  }

  overlay = document.createElement('div')
  overlay.className = 'markz-quick-overlay'
  overlay.innerHTML = `
    <div class="markz-quick-modal markz-search-modal">
      <input class="markz-quick-input" type="text" placeholder="Search in workspace…" autofocus>
      <div class="markz-search-hint"></div>
      <div class="markz-search-list markz-quick-list"></div>
    </div>
  `

  document.body.appendChild(overlay)

  const input = overlay.querySelector('.markz-quick-input') as HTMLInputElement
  const root = getRoot()
  selectedIndex = 0
  results = []
  renderList(root, '')

  input.addEventListener('input', () => {
    selectedIndex = 0
    scheduleSearch(input.value)
  })

  input.addEventListener('keydown', (e) => {
    const list = overlay?.querySelector('.markz-search-list')
    const items = list?.querySelectorAll('.markz-search-item')

    if (e.key === 'ArrowDown' && items && items.length > 0) {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1)
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex))
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp' && items && items.length > 0) {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex))
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items && items.length > 0) {
        (items[selectedIndex] as HTMLElement)?.click()
      }
    } else if (e.key === 'Escape') {
      close()
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
}

export function close() {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  overlay?.remove()
  overlay = null
  results = []
}
