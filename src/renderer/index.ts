import './base.css'
import 'katex/dist/katex.min.css'
import { createTitleBar } from './components/titleBar'
import { createEditor } from './editor/setup'
import { TabManager } from './editor/tabManager'
import { createTabBar } from './components/tabBar'
import { createStatusBar } from './components/statusBar'
import { createOutlinePanel } from './components/outlinePanel'
import {
  createSidebar, toggleSidebar, loadFolder,
  setSidebarCallbacks, getWorkspaceRoot, refreshSidebar,
} from './components/sidebar'
import {
  open as openQuickly, setOpenQuicklyCallback, updateFileIndex,
} from './components/openQuickly'
import {
  openGlobalSearch, setGlobalSearchCallbacks,
} from './components/globalSearch'
import {
  registerCommands, openCommandPalette, PaletteCommand,
} from './components/commandPalette'
import { openSearchPanel } from '@codemirror/search'
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

createTitleBar(editorRoot)
createSidebar(editorRoot)
createOutlinePanel(editorRoot)
const view = createEditor(editorRoot, '')
const tabManager = new TabManager(view)
createTabBar(editorRoot, tabManager)
createStatusBar(editorRoot)

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

setImageInsertFileGetter(() => tabManager.getActiveFilePath())
initZoom()

let sourceMode = false

function toggleSourceMode() {
  sourceMode = !sourceMode
  document.body.classList.toggle('markz-source-mode', sourceMode)
}

setSidebarCallbacks({
  onFileOpen: (filePath) => tabManager.openFileByPath(filePath),

  onFileCreate: async (dirPath) => {
    const name = prompt('New file name:', 'untitled.md')
    if (!name) return
    const sep = dirPath.endsWith('/') ? '' : '/'
    const fullPath = dirPath + sep + name
    await window.electronAPI.createFile(fullPath)
    refreshSidebar()
    await tabManager.openFileByPath(fullPath)
  },

  onFileRename: async (oldPath, newPath) => {
    await window.electronAPI.renameFile(oldPath, newPath)
    tabManager.onFileRenamed(oldPath, newPath)
    refreshSidebar()
  },

  onFileDelete: async (filePath) => {
    if (!confirm(`Move "${filePath.split('/').pop()}" to trash?`)) return
    await window.electronAPI.deleteFile(filePath)
    tabManager.onFileDeleted(filePath)
    refreshSidebar()
  },
})

setOpenQuicklyCallback((filePath) => tabManager.openFileByPath(filePath))

setGlobalSearchCallbacks(
  (match) => tabManager.openFileAtMatch(match.filePath, match.offset, match.matchLength),
  () => getWorkspaceRoot(),
)

window.electronAPI.onFolderChanged(() => {
  refreshSidebar()
  const root = getWorkspaceRoot()
  if (root) {
    window.electronAPI.listAllFiles(root).then((files) => {
      updateFileIndex(root, files)
    })
  }
})

const commands: PaletteCommand[] = [
  { id: 'new', label: 'File: New', shortcut: 'Cmd+N', action: () => dispatchMenu('new') },
  { id: 'open', label: 'File: Open…', shortcut: 'Cmd+O', action: () => dispatchMenu('open') },
  { id: 'open-folder', label: 'File: Open Folder…', action: () => dispatchMenu('open-folder') },
  { id: 'save', label: 'File: Save', shortcut: 'Cmd+S', action: () => dispatchMenu('save') },
  { id: 'save-as', label: 'File: Save As…', shortcut: 'Cmd+Shift+S', action: () => dispatchMenu('save-as') },
  { id: 'close-tab', label: 'File: Close Tab', shortcut: 'Cmd+W', action: () => dispatchMenu('close-tab') },
  { id: 'global-search', label: 'Search: In Workspace', shortcut: 'Cmd+Shift+F', action: () => dispatchMenu('global-search') },
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

async function menuHandler(action: string, ...args: unknown[]) {
  switch (action) {
    case 'new':
      tabManager.newUntitled()
      break
    case 'open': {
      const result = await window.electronAPI.openFile()
      if (result) tabManager.loadFromDialog(result.filePath, result.content)
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
      if (filePath) await tabManager.openFileByPath(filePath)
      break
    }
    case 'clear-recent':
      await window.electronAPI.setConfig({ recentFiles: [] })
      break
    case 'save':
      await tabManager.saveActive()
      break
    case 'save-as':
      await tabManager.saveActiveAs()
      break
    case 'close-tab':
      await tabManager.closeActiveTab()
      break
    case 'global-search':
      openGlobalSearch()
      break
    case 'find':
    case 'replace':
      openSearchPanel(view)
      break
    case 'toggle-sidebar':
      toggleSidebar()
      break
    case 'toggle-outline': {
      const panel = document.getElementById('outline-panel')
      if (panel) panel.classList.toggle('visible')
      break
    }
    case 'toggle-source':
      toggleSourceMode()
      break
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
    case 'command-palette':
      openCommandPalette()
      break
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
    case 'export-pdf':
      await window.electronAPI.exportPDF(tabManager.getActiveContent(), '', {})
      break
    case 'export-html':
      await window.electronAPI.exportHTML(tabManager.getActiveContent(), '')
      break
    case 'insert-image':
      await insertImageFromDialog(view)
      break
    case 'preferences':
      openPreferences()
      break
  }
}

window.electronAPI.onMenuAction(menuHandler)

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ',') {
    e.preventDefault()
    openPreferences()
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
    e.preventDefault()
    tabManager.closeActiveTab()
  }
})
