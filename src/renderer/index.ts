import './base.css'
import 'katex/dist/katex.min.css'
import { createEditor } from './editor/setup'
import { createStatusBar, updateFileStatus } from './components/statusBar'
import { createOutlinePanel } from './components/outlinePanel'
import {
  createSidebar, toggleSidebar, loadFolder,
  setSidebarCallbacks, setCurrentFile, getWorkspaceRoot, refreshSidebar,
} from './components/sidebar'
import {
  open as openQuickly, setOpenQuicklyCallback, updateFileIndex,
} from './components/openQuickly'
import {
  registerCommands, openCommandPalette, PaletteCommand,
} from './components/commandPalette'
import { openSearchPanel } from '@codemirror/search'
import { EditorView } from '@codemirror/view'
import { wrapSelection, setHeading } from './editor/keymap'
import { toggleFocusMode, focusModeState } from './editor/focusMode'
import { toggleTypewriterMode, typewriterModeState } from './editor/typewriterMode'
import {
  initThemeSystem, applyTheme, setDarkMode,
  applyFontSize, applyFontFamily, applyWritingWidth,
} from './components/themeManager'
import {
  openPreferences, setPreferencesSaveCallback, loadPreferencesState,
} from './components/preferences'
import { setImageInsertFileGetter, insertImageFromDialog } from './editor/imageInsert'
import { initZoom } from './components/zoom'

const editorRoot = document.getElementById('editor-root')!

createSidebar(editorRoot)
createOutlinePanel(editorRoot)
const view = createEditor(editorRoot)
createStatusBar(editorRoot)

// Theme and preferences initialization
initThemeSystem()
;(async () => {
  const config = await window.electronAPI.getConfig()
  const appearance = (config.appearance || {}) as Record<string, unknown>
  applyTheme((appearance.theme as string) || 'github')
  setDarkMode((appearance.darkMode as 'auto' | 'light' | 'dark') || 'auto')
  applyFontSize((appearance.fontSize as number) || 16)
  applyFontFamily((appearance.fontFamily as string) || '')
  applyWritingWidth((appearance.writingWidth as number) || 800)
  loadPreferencesState(config)
})()
setPreferencesSaveCallback(async (partial) => {
  await window.electronAPI.setConfig(partial)
})

let currentFilePath: string | null = null
let savedContent: string = view.state.doc.toString()

setImageInsertFileGetter(() => currentFilePath)
initZoom()
let lastKnownMtime: number | null = null
let sourceMode = false

function markModified(): void {
  const current = view.state.doc.toString()
  const name = currentFilePath
    ? currentFilePath.split('/').pop() || 'Untitled'
    : 'Untitled'
  updateFileStatus(name, current !== savedContent)
}

function loadContent(filePath: string, content: string): void {
  currentFilePath = filePath
  savedContent = content
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  })
  markModified()
  setCurrentFile(filePath)
  trackMtime(filePath)
}

async function openFileByPath(filePath: string): Promise<void> {
  try {
    const content = await window.electronAPI.readFile(filePath)
    loadContent(filePath, content)
  } catch (err) {
    console.error('Failed to open file:', err)
  }
}

async function trackMtime(filePath: string) {
  const stat = await window.electronAPI.fileStat(filePath)
  lastKnownMtime = stat?.mtime ?? null
}

// Auto-save
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoSave(): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (!currentFilePath) return
  autoSaveTimer = setTimeout(async () => {
    const content = view.state.doc.toString()
    if (content !== savedContent && currentFilePath) {
      await window.electronAPI.writeFile(currentFilePath, content)
      savedContent = content
      markModified()
      trackMtime(currentFilePath)
    }
  }, 5000)
}

// Dispatch wrapper for change tracking
const originalDispatch = view.dispatch.bind(view)
;(view as any).dispatch = function (...args: any[]) {
  originalDispatch(...args)
  markModified()
  scheduleAutoSave()
}

// External change detection: poll every 3s
setInterval(async () => {
  if (!currentFilePath || lastKnownMtime === null) return
  const stat = await window.electronAPI.fileStat(currentFilePath)
  if (!stat) return
  if (stat.mtime > lastKnownMtime) {
    lastKnownMtime = stat.mtime
    const current = view.state.doc.toString()
    if (current === savedContent) {
      const content = await window.electronAPI.readFile(currentFilePath)
      if (content !== savedContent) {
        savedContent = content
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
        })
        markModified()
      }
    }
  }
}, 3000)

// Sidebar callbacks
setSidebarCallbacks({
  onFileOpen: (filePath) => openFileByPath(filePath),

  onFileCreate: async (dirPath) => {
    const name = prompt('New file name:', 'untitled.md')
    if (!name) return
    const sep = dirPath.endsWith('/') ? '' : '/'
    const fullPath = dirPath + sep + name
    await window.electronAPI.createFile(fullPath)
    refreshSidebar()
    await openFileByPath(fullPath)
  },

  onFileRename: async (oldPath, newPath) => {
    await window.electronAPI.renameFile(oldPath, newPath)
    if (currentFilePath === oldPath) {
      currentFilePath = newPath
      markModified()
      setCurrentFile(newPath)
    }
    refreshSidebar()
  },

  onFileDelete: async (filePath) => {
    if (!confirm(`Move "${filePath.split('/').pop()}" to trash?`)) return
    await window.electronAPI.deleteFile(filePath)
    if (currentFilePath === filePath) {
      currentFilePath = null
      savedContent = ''
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } })
      markModified()
    }
    refreshSidebar()
  },
})

// Open Quickly callback
setOpenQuicklyCallback((filePath) => openFileByPath(filePath))

// Watch for folder changes
window.electronAPI.onFolderChanged(() => {
  refreshSidebar()
  const root = getWorkspaceRoot()
  if (root) {
    window.electronAPI.listAllFiles(root).then((files) => {
      updateFileIndex(root, files)
    })
  }
})

// Source mode toggle helper
function toggleSourceMode() {
  sourceMode = !sourceMode
  document.body.classList.toggle('markz-source-mode', sourceMode)
}

// Command palette commands
const commands: PaletteCommand[] = [
  { id: 'new', label: 'File: New', shortcut: 'Cmd+N', action: () => dispatchMenu('new') },
  { id: 'open', label: 'File: Open…', shortcut: 'Cmd+O', action: () => dispatchMenu('open') },
  { id: 'open-folder', label: 'File: Open Folder…', action: () => dispatchMenu('open-folder') },
  { id: 'save', label: 'File: Save', shortcut: 'Cmd+S', action: () => dispatchMenu('save') },
  { id: 'save-as', label: 'File: Save As…', shortcut: 'Cmd+Shift+S', action: () => dispatchMenu('save-as') },
  { id: 'find', label: 'Edit: Find', shortcut: 'Cmd+F', action: () => openSearchPanel(view) },
  { id: 'replace', label: 'Edit: Find and Replace', action: () => openSearchPanel(view) },
  { id: 'toggle-sidebar', label: 'View: Toggle Sidebar', shortcut: 'Cmd+\\', action: () => toggleSidebar() },
  { id: 'toggle-outline', label: 'View: Toggle Outline', shortcut: 'Cmd+Shift+O', action: () => {
    const panel = document.getElementById('outline-panel')
    if (panel) panel.classList.toggle('visible')
  }},
  { id: 'source-mode', label: 'View: Toggle Source Mode', shortcut: 'Cmd+/', action: () => toggleSourceMode() },
  { id: 'focus-mode', label: 'View: Toggle Focus Mode', action: () => {
    const current = view.state.field(focusModeState)
    view.dispatch({ effects: toggleFocusMode.of(!current) })
  }},
  { id: 'typewriter-mode', label: 'View: Toggle Typewriter Mode', action: () => {
    const current = view.state.field(typewriterModeState)
    view.dispatch({ effects: toggleTypewriterMode.of(!current) })
  }},
  { id: 'bold', label: 'Format: Bold', shortcut: 'Cmd+B', action: () => { view.focus(); wrapSelection(view, '**', '**') }},
  { id: 'italic', label: 'Format: Italic', shortcut: 'Cmd+I', action: () => { view.focus(); wrapSelection(view, '*', '*') }},
  { id: 'strikethrough', label: 'Format: Strikethrough', shortcut: 'Cmd+Shift+X', action: () => { view.focus(); wrapSelection(view, '~~', '~~') }},
  { id: 'h1', label: 'Format: Heading 1', shortcut: 'Cmd+1', action: () => { view.focus(); setHeading(view, 1) }},
  { id: 'h2', label: 'Format: Heading 2', shortcut: 'Cmd+2', action: () => { view.focus(); setHeading(view, 2) }},
  { id: 'h3', label: 'Format: Heading 3', shortcut: 'Cmd+3', action: () => { view.focus(); setHeading(view, 3) }},
  { id: 'insert-image', label: 'Insert: Image…', action: () => insertImageFromDialog(view) },
  { id: 'export-pdf', label: 'Export: PDF…', shortcut: 'Cmd+Shift+E', action: () => dispatchMenu('export-pdf') },
  { id: 'export-html', label: 'Export: HTML…', action: () => dispatchMenu('export-html') },
  { id: 'preferences', label: 'Preferences…', shortcut: 'Cmd+,', action: () => openPreferences() },
]
registerCommands(commands)

function dispatchMenu(action: string) {
  menuHandler(action)
}

// Menu actions handler
async function menuHandler(action: string, ...args: unknown[]) {
  switch (action) {
    case 'new': {
      currentFilePath = null
      savedContent = ''
      lastKnownMtime = null
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: '' },
      })
      markModified()
      setCurrentFile(null)
      break
    }
    case 'open': {
      const result = await window.electronAPI.openFile()
      if (result) {
        loadContent(result.filePath, result.content)
      }
      break
    }
    case 'open-folder': {
      const folder = await window.electronAPI.openFolder()
      if (folder) {
        await loadFolder(folder)
        const sidebar = document.getElementById('sidebar')
        if (sidebar && !sidebar.classList.contains('visible')) {
          sidebar.classList.add('visible')
        }
        const files = await window.electronAPI.listAllFiles(folder)
        updateFileIndex(folder, files)
      }
      break
    }
    case 'open-quickly': {
      const root = getWorkspaceRoot()
      if (root) {
        const files = await window.electronAPI.listAllFiles(root)
        updateFileIndex(root, files)
      }
      openQuickly()
      break
    }
    case 'open-recent': {
      const filePath = args[0] as string
      if (filePath) await openFileByPath(filePath)
      break
    }
    case 'clear-recent': {
      await window.electronAPI.setConfig({ recentFiles: [] })
      break
    }
    case 'save': {
      const content = view.state.doc.toString()
      const path = await window.electronAPI.saveFile(content, currentFilePath || undefined)
      if (path) {
        currentFilePath = path
        savedContent = content
        markModified()
        setCurrentFile(path)
        trackMtime(path)
      }
      break
    }
    case 'save-as': {
      const content = view.state.doc.toString()
      const path = await window.electronAPI.saveFileAs(content)
      if (path) {
        currentFilePath = path
        savedContent = content
        markModified()
        setCurrentFile(path)
        trackMtime(path)
      }
      break
    }
    case 'find': {
      openSearchPanel(view)
      break
    }
    case 'replace': {
      openSearchPanel(view)
      break
    }
    case 'toggle-sidebar': {
      toggleSidebar()
      break
    }
    case 'toggle-outline': {
      const panel = document.getElementById('outline-panel')
      if (panel) panel.classList.toggle('visible')
      break
    }
    case 'toggle-source': {
      toggleSourceMode()
      break
    }
    case 'toggle-focus': {
      const current = view.state.field(focusModeState)
      view.dispatch({ effects: toggleFocusMode.of(!current) })
      break
    }
    case 'toggle-typewriter': {
      const current = view.state.field(typewriterModeState)
      view.dispatch({ effects: toggleTypewriterMode.of(!current) })
      break
    }
    case 'command-palette': {
      openCommandPalette()
      break
    }
    case 'format': {
      view.focus()
      const fmt = args[0] as string
      if (fmt === 'bold') wrapSelection(view, '**', '**')
      if (fmt === 'italic') wrapSelection(view, '*', '*')
      if (fmt === 'strikethrough') wrapSelection(view, '~~', '~~')
      if (fmt === 'h1') setHeading(view, 1)
      if (fmt === 'h2') setHeading(view, 2)
      if (fmt === 'h3') setHeading(view, 3)
      break
    }
    case 'export-pdf': {
      const content = view.state.doc.toString()
      await window.electronAPI.exportPDF(content, '', {})
      break
    }
    case 'export-html': {
      const content = view.state.doc.toString()
      await window.electronAPI.exportHTML(content, '')
      break
    }
    case 'insert-image': {
      await insertImageFromDialog(view)
      break
    }
    case 'preferences': {
      openPreferences()
      break
    }
  }
}

window.electronAPI.onMenuAction(menuHandler)

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ',') {
    e.preventDefault()
    openPreferences()
  }
})
