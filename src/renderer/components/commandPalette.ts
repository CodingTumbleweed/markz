export interface PaletteCommand {
  id: string
  label: string
  shortcut?: string
  action: () => void
}

let overlay: HTMLElement | null = null
let allCommands: PaletteCommand[] = []
let selectedIndex = 0

export function registerCommands(commands: PaletteCommand[]) {
  allCommands = commands
}

function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (!q) return { match: true, score: 0 }
  let qi = 0, score = 0, lastIdx = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += (ti === lastIdx + 1) ? 10 : 1
      if (ti === 0 || /\W/.test(t[ti - 1])) score += 5
      lastIdx = ti
      qi++
    }
  }
  return { match: qi === q.length, score }
}

function render(query: string) {
  if (!overlay) return
  const list = overlay.querySelector('.markz-palette-list') as HTMLElement
  list.innerHTML = ''

  const results = allCommands
    .map((c) => ({ ...c, ...fuzzyMatch(query, c.label) }))
    .filter((r) => r.match)
    .sort((a, b) => b.score - a.score)

  selectedIndex = Math.min(selectedIndex, results.length - 1)
  if (selectedIndex < 0) selectedIndex = 0

  results.forEach((r, i) => {
    const item = document.createElement('div')
    item.className = 'markz-palette-item' + (i === selectedIndex ? ' selected' : '')
    item.innerHTML = `<span class="markz-palette-label">${escapeHtml(r.label)}</span>${r.shortcut ? `<span class="markz-palette-shortcut">${escapeHtml(r.shortcut)}</span>` : ''}`
    item.addEventListener('click', () => { close(); r.action() })
    item.addEventListener('mouseenter', () => {
      selectedIndex = i
      list.querySelectorAll('.markz-palette-item').forEach((el, idx) => {
        el.classList.toggle('selected', idx === i)
      })
    })
    list.appendChild(item)
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function openCommandPalette() {
  if (overlay) { close(); return }

  overlay = document.createElement('div')
  overlay.className = 'markz-quick-overlay'
  overlay.innerHTML = `
    <div class="markz-quick-modal">
      <input class="markz-quick-input" type="text" placeholder="Type a command…" autofocus>
      <div class="markz-palette-list"></div>
    </div>
  `
  document.body.appendChild(overlay)

  const input = overlay.querySelector('.markz-quick-input') as HTMLInputElement
  selectedIndex = 0
  render('')

  input.addEventListener('input', () => { selectedIndex = 0; render(input.value) })

  input.addEventListener('keydown', (e) => {
    const items = overlay?.querySelectorAll('.markz-palette-item')
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
      ;(items[selectedIndex] as HTMLElement)?.click()
    } else if (e.key === 'Escape') {
      close()
    }
  })

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
}

export function close() {
  overlay?.remove()
  overlay = null
}
