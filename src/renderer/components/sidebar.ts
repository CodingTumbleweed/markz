import type { DirEntry } from '../../shared/types'
import { ICON_LIST, ICON_TREE } from './icons'

type FileOpenCallback = (filePath: string) => void
type FileCreateCallback = (dirPath: string, name?: string) => void | Promise<void>
type FileRenameCallback = (oldPath: string, newPath: string) => void
type FileDeleteCallback = (filePath: string) => void
type SidebarView = 'tree' | 'list'

let onFileOpen: FileOpenCallback = () => {}
let onFileCreate: FileCreateCallback = () => {}
let onFileRename: FileRenameCallback = () => {}
let onFileDelete: FileDeleteCallback = () => {}

let workspaceRoot: string | null = null
let sidebarEl: HTMLElement | null = null
let currentOpenFile: string | null = null
let sidebarView: SidebarView = 'tree'
let newFileInputActive = false

const expandedDirs = new Set<string>()

const FILE_ICONS: Record<string, string> = {
  md: '📄', markdown: '📄', txt: '📝',
  js: '🟨', ts: '🔷', jsx: '⚛️', tsx: '⚛️',
  json: '📋', css: '🎨', html: '🌐',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
  pdf: '📕', yml: '⚙️', yaml: '⚙️',
}

function getFileIcon(name: string, isDir = false): string {
  if (isDir) return '📁'
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_ICONS[ext] || '📄'
}

function relativePath(filePath: string): string {
  if (workspaceRoot && filePath.startsWith(workspaceRoot)) {
    return filePath.slice(workspaceRoot.length + 1)
  }
  return filePath
}

function ensureSidebarVisible(): void {
  const el = document.getElementById('sidebar')
  if (el && !el.classList.contains('visible')) {
    el.classList.add('visible')
  }
}

export function setSidebarCallbacks(callbacks: {
  onFileOpen: FileOpenCallback
  onFileCreate: FileCreateCallback
  onFileRename: FileRenameCallback
  onFileDelete: FileDeleteCallback
}) {
  onFileOpen = callbacks.onFileOpen
  onFileCreate = callbacks.onFileCreate
  onFileRename = callbacks.onFileRename
  onFileDelete = callbacks.onFileDelete
}

export function setCurrentFile(filePath: string | null) {
  currentOpenFile = filePath
  highlightActiveFile()
}

export function getSidebarView(): SidebarView {
  return sidebarView
}

export async function setSidebarView(view: SidebarView, persist = true): Promise<void> {
  sidebarView = view
  ensureSidebarVisible()
  updateViewToggleUI()
  if (workspaceRoot) {
    await renderSidebarContent(workspaceRoot)
  }
  if (persist) {
    const config = await window.electronAPI.getConfig()
    const general = (config.general || {}) as Record<string, unknown>
    await window.electronAPI.setConfig({
      general: { ...general, sidebarView: view },
    })
  }
}

export async function toggleSidebarView(): Promise<void> {
  await setSidebarView(sidebarView === 'tree' ? 'list' : 'tree')
}

function updateViewToggleUI() {
  if (!sidebarEl) return
  sidebarEl.querySelector('#sidebar-view-tree')?.classList.toggle('active', sidebarView === 'tree')
  sidebarEl.querySelector('#sidebar-view-list')?.classList.toggle('active', sidebarView === 'list')
}

function highlightActiveFile() {
  if (!sidebarEl) return
  sidebarEl.querySelectorAll('.markz-sidebar-file').forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.path === currentOpenFile)
  })
}

function getFileListContainer(): HTMLElement | null {
  const content = document.getElementById('sidebar-content')
  if (!content) return null
  return content.querySelector('.markz-file-tree, .markz-file-list') as HTMLElement | null
}

function showInlineNewFileInput() {
  if (!workspaceRoot || newFileInputActive) return

  const container = getFileListContainer()
  if (!container) return

  newFileInputActive = true
  const row = document.createElement('div')
  row.className = 'markz-new-file-row'
  row.id = 'sidebar-new-file-row'

  const input = document.createElement('input')
  input.className = 'markz-new-file-input'
  input.type = 'text'
  input.value = 'untitled.md'
  row.appendChild(input)

  container.insertBefore(row, container.firstChild)
  input.focus()
  input.setSelectionRange(0, input.value.lastIndexOf('.') > 0 ? input.value.lastIndexOf('.') : input.value.length)

  const cancel = () => {
    newFileInputActive = false
    row.remove()
  }

  const commit = async () => {
    const name = input.value.trim()
    cancel()
    if (name && workspaceRoot) {
      await onFileCreate(workspaceRoot, name)
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void commit() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  })
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!document.getElementById('sidebar-new-file-row')) return
      const name = input.value.trim()
      if (name) void commit()
      else cancel()
    }, 100)
  })
}

export function createSidebar(parent: HTMLElement): HTMLElement {
  const sidebar = document.createElement('div')
  sidebar.className = 'markz-sidebar'
  sidebar.id = 'sidebar'
  sidebar.innerHTML = `
    <div class="markz-sidebar-header">
      <span>Files</span>
      <div class="markz-sidebar-actions">
        <button class="markz-sidebar-btn markz-sidebar-view-btn" id="sidebar-view-tree" title="Tree view" type="button">${ICON_TREE}</button>
        <button class="markz-sidebar-btn markz-sidebar-view-btn" id="sidebar-view-list" title="File list" type="button">${ICON_LIST}</button>
        <button class="markz-sidebar-btn" id="sidebar-new-file" title="New File" type="button">+</button>
      </div>
    </div>
    <div class="markz-sidebar-content" id="sidebar-content">
      <div class="markz-sidebar-empty">Open a folder to browse files<br><br><button class="markz-open-folder-btn" id="sidebar-open-folder">Open Folder</button></div>
    </div>
  `
  parent.insertBefore(sidebar, parent.firstChild)
  sidebarEl = sidebar
  updateViewToggleUI()

  sidebar.querySelector('#sidebar-open-folder')?.addEventListener('click', async () => {
    const folder = await window.electronAPI.openFolder()
    if (folder) await loadFolder(folder)
  })

  sidebar.querySelector('#sidebar-new-file')?.addEventListener('click', () => {
    showInlineNewFileInput()
  })

  sidebar.querySelector('#sidebar-view-tree')?.addEventListener('click', () => {
    void setSidebarView('tree')
  })

  sidebar.querySelector('#sidebar-view-list')?.addEventListener('click', () => {
    void setSidebarView('list')
  })

  return sidebar
}

export function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('visible')
  }
}

export async function loadFolder(dirPath: string): Promise<void> {
  workspaceRoot = dirPath
  const content = document.getElementById('sidebar-content')
  if (!content) return

  content.innerHTML = '<div class="markz-sidebar-loading">Loading…</div>'

  await window.electronAPI.watchFolder(dirPath)
  await renderSidebarContent(dirPath)
}

async function renderSidebarContent(dirPath: string): Promise<void> {
  const content = document.getElementById('sidebar-content')
  if (!content) return

  newFileInputActive = false
  content.innerHTML = ''

  const folderLabel = document.createElement('div')
  folderLabel.className = 'markz-workspace-label'
  folderLabel.textContent = dirPath.split('/').pop() || dirPath
  folderLabel.title = dirPath
  content.appendChild(folderLabel)

  if (sidebarView === 'list') {
    const files = await window.electronAPI.listAllFiles(dirPath)
    renderFileList(content, files)
  } else {
    const entries = await window.electronAPI.listDirectory(dirPath)
    const tree = document.createElement('div')
    tree.className = 'markz-file-tree'
    content.appendChild(tree)
    renderEntries(tree, entries, 0)
  }

  highlightActiveFile()
}

function renderFileList(container: HTMLElement, files: string[]) {
  const list = document.createElement('div')
  list.className = 'markz-file-list'

  const sorted = [...files].sort((a, b) =>
    relativePath(a).localeCompare(relativePath(b), undefined, { numeric: true, sensitivity: 'base' }),
  )

  for (const filePath of sorted) {
    const rel = relativePath(filePath)
    const name = rel.split('/').pop() || rel
    const dir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : ''
    const icon = getFileIcon(name)

    const item = document.createElement('div')
    item.className = 'markz-list-item markz-sidebar-file'
    item.dataset.path = filePath
    item.innerHTML =
      `<span class="markz-list-row">` +
      `<span class="markz-tree-icon">${icon}</span>` +
      `<span class="markz-list-name">${name}</span>` +
      `</span>` +
      (dir ? `<span class="markz-list-dir">${dir}</span>` : '')

    item.addEventListener('click', (e) => {
      e.stopPropagation()
      onFileOpen(filePath)
    })

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation()
      showContextMenu(e, { name, path: filePath, isDir: false })
    })

    list.appendChild(item)
  }

  if (sorted.length === 0) {
    list.innerHTML = '<div class="markz-sidebar-empty">No files in this folder</div>'
  }

  container.appendChild(list)
}

function renderEntries(container: HTMLElement, entries: DirEntry[], depth: number) {
  for (const entry of entries) {
    const item = document.createElement('div')
    item.className = 'markz-tree-item markz-sidebar-file'
    item.dataset.path = entry.path
    item.style.paddingLeft = `${depth * 16 + 8}px`

    const icon = getFileIcon(entry.name, entry.isDir)
    const chevron = entry.isDir ? (expandedDirs.has(entry.path) ? '▾' : '▸') : ''

    item.innerHTML = `<span class="markz-tree-chevron">${chevron}</span><span class="markz-tree-icon">${icon}</span><span class="markz-tree-name">${entry.name}</span>`

    if (entry.isDir) {
      item.classList.add('is-dir')
      const childContainer = document.createElement('div')
      childContainer.className = 'markz-tree-children'
      childContainer.style.display = expandedDirs.has(entry.path) ? 'block' : 'none'

      item.addEventListener('click', async (e) => {
        e.stopPropagation()
        const isExpanded = expandedDirs.has(entry.path)
        if (isExpanded) {
          expandedDirs.delete(entry.path)
          childContainer.style.display = 'none'
          item.querySelector('.markz-tree-chevron')!.textContent = '▸'
        } else {
          expandedDirs.add(entry.path)
          childContainer.innerHTML = ''
          const children = await window.electronAPI.listDirectory(entry.path)
          renderEntries(childContainer, children, depth + 1)
          childContainer.style.display = 'block'
          item.querySelector('.markz-tree-chevron')!.textContent = '▾'
        }
      })

      if (expandedDirs.has(entry.path)) {
        window.electronAPI.listDirectory(entry.path).then((children) => {
          renderEntries(childContainer, children, depth + 1)
        })
      }

      container.appendChild(item)
      container.appendChild(childContainer)
    } else {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        onFileOpen(entry.path)
      })

      item.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        e.stopPropagation()
        showContextMenu(e, entry)
      })

      container.appendChild(item)
    }
  }
}

function showContextMenu(e: MouseEvent, entry: DirEntry) {
  document.querySelectorAll('.markz-context-menu').forEach((m) => m.remove())

  const menu = document.createElement('div')
  menu.className = 'markz-context-menu'
  menu.style.left = `${e.clientX}px`
  menu.style.top = `${e.clientY}px`

  const items = [
    { label: 'Rename', action: () => startRename(entry) },
    { label: 'Delete', action: () => onFileDelete(entry.path) },
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

function startRename(entry: DirEntry) {
  const item = sidebarEl?.querySelector(`[data-path="${CSS.escape(entry.path)}"]`) as HTMLElement
  if (!item) return

  const nameSpan = (item.querySelector('.markz-tree-name') || item.querySelector('.markz-list-name')) as HTMLElement
  if (!nameSpan) return

  const oldName = entry.name
  const input = document.createElement('input')
  input.className = 'markz-rename-input'
  input.value = oldName
  input.type = 'text'

  nameSpan.replaceWith(input)
  input.focus()
  const dotIndex = oldName.lastIndexOf('.')
  input.setSelectionRange(0, dotIndex > 0 ? dotIndex : oldName.length)

  const commit = () => {
    const newName = input.value.trim()
    if (newName && newName !== oldName) {
      const dir = entry.path.substring(0, entry.path.length - oldName.length)
      onFileRename(entry.path, dir + newName)
    }
    input.replaceWith(nameSpan)
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { input.replaceWith(nameSpan) }
  })
  input.addEventListener('blur', commit)
}

export function getWorkspaceRoot(): string | null {
  return workspaceRoot
}

export function refreshSidebar(): void {
  if (workspaceRoot) loadFolder(workspaceRoot)
}
