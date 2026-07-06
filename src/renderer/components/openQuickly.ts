type OpenCallback = (filePath: string) => void

let overlay: HTMLElement | null = null
let allFiles: string[] = []
let workspaceRoot = ''
let selectedIndex = 0
let onOpen: OpenCallback = () => {}

export function setOpenQuicklyCallback(cb: OpenCallback) {
  onOpen = cb
}

export function updateFileIndex(root: string, files: string[]) {
  workspaceRoot = root
  allFiles = files
}

function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (!q) return { match: true, score: 0 }

  let qi = 0
  let score = 0
  let lastMatchIdx = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += (ti === lastMatchIdx + 1) ? 10 : 1
      if (ti === 0 || t[ti - 1] === '/' || t[ti - 1] === '\\' || t[ti - 1] === '.') score += 5
      lastMatchIdx = ti
      qi++
    }
  }

  return { match: qi === q.length, score }
}

function relativePath(filePath: string): string {
  if (workspaceRoot && filePath.startsWith(workspaceRoot)) {
    return filePath.slice(workspaceRoot.length + 1)
  }
  return filePath
}

function render(query: string) {
  if (!overlay) return

  const list = overlay.querySelector('.markz-quick-list') as HTMLElement
  list.innerHTML = ''

  const results = allFiles
    .map((f) => {
      const rel = relativePath(f)
      const { match, score } = fuzzyMatch(query, rel)
      return { path: f, rel, match, score }
    })
    .filter((r) => r.match)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  selectedIndex = Math.min(selectedIndex, results.length - 1)
  if (selectedIndex < 0) selectedIndex = 0

  results.forEach((r, i) => {
    const item = document.createElement('div')
    item.className = 'markz-quick-item' + (i === selectedIndex ? ' selected' : '')

    const name = r.rel.split('/').pop() || r.rel
    const dir = r.rel.includes('/') ? r.rel.substring(0, r.rel.lastIndexOf('/')) : ''

    item.innerHTML = `<span class="markz-quick-name">${escapeHtml(name)}</span>${dir ? `<span class="markz-quick-dir">${escapeHtml(dir)}</span>` : ''}`

    item.addEventListener('click', () => {
      close()
      onOpen(r.path)
    })
    item.addEventListener('mouseenter', () => {
      selectedIndex = i
      list.querySelectorAll('.markz-quick-item').forEach((el, idx) => {
        el.classList.toggle('selected', idx === i)
      })
    })
    list.appendChild(item)
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function open() {
  if (overlay) { close(); return }

  overlay = document.createElement('div')
  overlay.className = 'markz-quick-overlay'
  overlay.innerHTML = `
    <div class="markz-quick-modal">
      <input class="markz-quick-input" type="text" placeholder="Type to search files…" autofocus>
      <div class="markz-quick-list"></div>
    </div>
  `

  document.body.appendChild(overlay)

  const input = overlay.querySelector('.markz-quick-input') as HTMLInputElement
  selectedIndex = 0
  render('')

  input.addEventListener('input', () => {
    selectedIndex = 0
    render(input.value)
  })

  input.addEventListener('keydown', (e) => {
    const list = overlay?.querySelector('.markz-quick-list')
    const items = list?.querySelectorAll('.markz-quick-item')
    if (!items || items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1)
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex))
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIndex))
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = items[selectedIndex] as HTMLElement
      selected?.click()
    } else if (e.key === 'Escape') {
      close()
    }
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
}

export function close() {
  overlay?.remove()
  overlay = null
}
