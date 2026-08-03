import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { createEditorState, welcomeDoc } from './setup'
import { updateFileStatus } from '../components/statusBar'
import { setCurrentFile } from '../components/sidebar'

export interface TabInfo {
  id: string
  label: string
  filePath: string | null
  dirty: boolean
}

interface Tab {
  id: string
  filePath: string | null
  savedContent: string
  lastKnownMtime: number | null
  state: ReturnType<typeof createEditorState>
}

let nextTabId = 1

function tabLabel(filePath: string | null): string {
  if (!filePath) return 'Untitled'
  return filePath.split('/').pop() || 'Untitled'
}

export class TabManager {
  private tabs: Tab[] = []
  private activeTabId: string | null = null
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  private onTabsChange: (() => void) | null = null
  private mtimeInterval: ReturnType<typeof setInterval>

  constructor(private view: EditorView) {
    this.addTab(welcomeDoc, null, welcomeDoc, null, true)
    this.wrapDispatch()
    this.startMtimePolling()
  }

  setTabsChangeListener(fn: () => void): void {
    this.onTabsChange = fn
    fn()
  }

  getView(): EditorView {
    return this.view
  }

  getActiveTabId(): string | null {
    return this.activeTabId
  }

  getActiveFilePath(): string | null {
    return this.getActiveTab()?.filePath ?? null
  }

  getTabs(): TabInfo[] {
    return this.tabs.map((t) => ({
      id: t.id,
      label: tabLabel(t.filePath),
      filePath: t.filePath,
      dirty: this.isTabDirty(t),
    }))
  }

  getActiveContent(): string {
    return this.view.state.doc.toString()
  }

  private getActiveTab(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId)
  }

  private getTab(id: string): Tab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  private isTabDirty(tab: Tab): boolean {
    return tab.state.doc.toString() !== tab.savedContent
  }

  private notifyChange(): void {
    this.persistActiveState()
    this.onTabsChange?.()
    this.updateStatusBar()
  }

  private updateStatusBar(): void {
    const tab = this.getActiveTab()
    if (!tab) return
    const name = tabLabel(tab.filePath)
    updateFileStatus(name, this.isTabDirty(tab))
    setCurrentFile(tab.filePath)
  }

  private persistActiveState(): void {
    const tab = this.getActiveTab()
    if (tab) {
      tab.state = this.view.state
    }
  }

  private addTab(
    content: string,
    filePath: string | null,
    savedContent: string,
    mtime: number | null,
    activate: boolean,
  ): Tab {
    const tab: Tab = {
      id: `tab-${nextTabId++}`,
      filePath,
      savedContent,
      lastKnownMtime: mtime,
      state: createEditorState(content),
    }
    this.tabs.push(tab)
    if (activate) {
      this.activeTabId = tab.id
      this.view.setState(tab.state)
      this.updateStatusBar()
    }
    this.notifyChange()
    return tab
  }

  switchTab(id: string): void {
    if (id === this.activeTabId) return
    const target = this.getTab(id)
    if (!target) return
    this.persistActiveState()
    this.activeTabId = id
    this.view.setState(target.state)
    this.view.focus()
    this.notifyChange()
  }

  newTab(): void {
    this.persistActiveState()
    this.addTab('', null, '', null, true)
    this.view.focus()
  }

  async openFileByPath(filePath: string): Promise<void> {
    const existing = this.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      this.switchTab(existing.id)
      return
    }
    try {
      const content = await window.electronAPI.readFile(filePath)
      const stat = await window.electronAPI.fileStat(filePath)
      this.persistActiveState()
      this.addTab(content, filePath, content, stat?.mtime ?? null, true)
      this.view.focus()
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  async openFileAtMatch(
    filePath: string,
    offset: number,
    matchLength: number,
  ): Promise<void> {
    await this.openFileByPath(filePath)
    const docLen = this.view.state.doc.length
    const anchor = Math.min(offset, docLen)
    const head = Math.min(offset + matchLength, docLen)
    this.view.dispatch({
      selection: EditorSelection.create([EditorSelection.range(anchor, head)]),
      scrollIntoView: true,
    })
    this.view.focus()
  }

  loadFromDialog(filePath: string, content: string): void {
    const existing = this.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      this.switchTab(existing.id)
      return
    }
    this.persistActiveState()
    this.addTab(content, filePath, content, null, true)
    void this.trackMtime(filePath)
    this.view.focus()
  }

  newUntitled(): void {
    this.persistActiveState()
    this.addTab('', null, '', null, true)
    this.view.focus()
  }

  async closeTab(id: string): Promise<boolean> {
    const tab = this.getTab(id)
    if (!tab) return false

    this.persistActiveState()
    if (this.isTabDirty(tab)) {
      const name = tabLabel(tab.filePath)
      const discard = confirm(`"${name}" has unsaved changes. Close anyway?`)
      if (!discard) return false
    }

    const idx = this.tabs.findIndex((t) => t.id === id)
    this.tabs.splice(idx, 1)

    if (this.tabs.length === 0) {
      this.addTab(welcomeDoc, null, welcomeDoc, null, true)
    } else if (this.activeTabId === id) {
      const next = this.tabs[Math.min(idx, this.tabs.length - 1)]
      this.activeTabId = next.id
      this.view.setState(next.state)
    }

    this.notifyChange()
    return true
  }

  async closeActiveTab(): Promise<void> {
    if (this.activeTabId) {
      await this.closeTab(this.activeTabId)
    }
  }

  onFileRenamed(oldPath: string, newPath: string): void {
    for (const tab of this.tabs) {
      if (tab.filePath === oldPath) {
        tab.filePath = newPath
      }
    }
    this.notifyChange()
    this.updateStatusBar()
  }

  onFileDeleted(filePath: string): void {
    const toClose = this.tabs.filter((t) => t.filePath === filePath).map((t) => t.id)
    for (const id of toClose) {
      const tab = this.getTab(id)!
      const idx = this.tabs.findIndex((t) => t.id === id)
      this.tabs.splice(idx, 1)
      if (this.activeTabId === id) {
        if (this.tabs.length === 0) {
          this.addTab(welcomeDoc, null, welcomeDoc, null, true)
        } else {
          const next = this.tabs[Math.min(idx, this.tabs.length - 1)]
          this.activeTabId = next.id
          this.view.setState(next.state)
        }
      }
    }
    this.notifyChange()
  }

  private async trackMtime(filePath: string): Promise<void> {
    const tab = this.tabs.find((t) => t.filePath === filePath)
    if (!tab) return
    const stat = await window.electronAPI.fileStat(filePath)
    tab.lastKnownMtime = stat?.mtime ?? null
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer)
    const tab = this.getActiveTab()
    if (!tab?.filePath) return
    this.autoSaveTimer = setTimeout(async () => {
      const active = this.getActiveTab()
      if (!active?.filePath) return
      const content = this.view.state.doc.toString()
      if (content !== active.savedContent) {
        await window.electronAPI.writeFile(active.filePath, content)
        active.savedContent = content
        this.notifyChange()
        await this.trackMtime(active.filePath)
      }
    }, 5000)
  }

  private wrapDispatch(): void {
    const originalDispatch = this.view.dispatch.bind(this.view)
    ;(this.view as any).dispatch = (...args: unknown[]) => {
      originalDispatch(...(args as Parameters<typeof this.view.dispatch>))
      this.notifyChange()
      this.scheduleAutoSave()
    }
  }

  private startMtimePolling(): void {
    this.mtimeInterval = setInterval(async () => {
      const tab = this.getActiveTab()
      if (!tab?.filePath || tab.lastKnownMtime === null) return
      const stat = await window.electronAPI.fileStat(tab.filePath)
      if (!stat) return
      if (stat.mtime > tab.lastKnownMtime) {
        tab.lastKnownMtime = stat.mtime
        const current = tab.state.doc.toString()
        if (current === tab.savedContent) {
          const content = await window.electronAPI.readFile(tab.filePath)
          if (content !== tab.savedContent) {
            tab.savedContent = content
            tab.state = createEditorState(content)
            if (tab.id === this.activeTabId) {
              this.view.setState(tab.state)
            }
            this.notifyChange()
          }
        }
      }
    }, 3000)
  }

  async saveActive(): Promise<string | null> {
    this.persistActiveState()
    const tab = this.getActiveTab()
    if (!tab) return null
    const content = tab.state.doc.toString()
    const path = await window.electronAPI.saveFile(content, tab.filePath || undefined)
    if (path) {
      tab.filePath = path
      tab.savedContent = content
      tab.state = this.view.state
      await this.trackMtime(path)
      this.notifyChange()
    }
    return path
  }

  async saveActiveAs(): Promise<string | null> {
    this.persistActiveState()
    const tab = this.getActiveTab()
    if (!tab) return null
    const content = tab.state.doc.toString()
    const path = await window.electronAPI.saveFileAs(content)
    if (path) {
      tab.filePath = path
      tab.savedContent = content
      tab.state = this.view.state
      await this.trackMtime(path)
      this.notifyChange()
    }
    return path
  }
}
