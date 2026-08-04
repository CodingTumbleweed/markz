import type { TabManager, TabInfo } from '../editor/tabManager'
import { ICON_OUTLINE, ICON_SIDEBAR } from './icons'

export interface TabBarOptions {
  onToggleSidebar?: () => void
  onToggleOutline?: () => void
}

export function syncTabBarChromeState(): void {
  const sidebar = document.getElementById('sidebar')
  const outline = document.getElementById('outline-panel')
  document.getElementById('chrome-sidebar')?.classList.toggle(
    'active',
    !!sidebar?.classList.contains('visible'),
  )
  document.getElementById('chrome-outline')?.classList.toggle(
    'active',
    !!outline?.classList.contains('visible'),
  )
}

export function createTabBar(
  parent: HTMLElement,
  manager: TabManager,
  options: TabBarOptions = {},
): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'markz-tab-bar'
  bar.id = 'tab-bar'

  const chromeLeft = document.createElement('div')
  chromeLeft.className = 'markz-tab-chrome-left'

  const sidebarBtn = document.createElement('button')
  sidebarBtn.className = 'markz-chrome-btn'
  sidebarBtn.id = 'chrome-sidebar'
  sidebarBtn.type = 'button'
  sidebarBtn.title = 'Toggle Sidebar (Cmd+\\)'
  sidebarBtn.innerHTML = ICON_SIDEBAR
  sidebarBtn.addEventListener('click', () => options.onToggleSidebar?.())
  chromeLeft.appendChild(sidebarBtn)

  const outlineBtn = document.createElement('button')
  outlineBtn.className = 'markz-chrome-btn'
  outlineBtn.id = 'chrome-outline'
  outlineBtn.type = 'button'
  outlineBtn.title = 'Toggle Outline (Cmd+Shift+O)'
  outlineBtn.innerHTML = ICON_OUTLINE
  outlineBtn.addEventListener('click', () => options.onToggleOutline?.())
  chromeLeft.appendChild(outlineBtn)

  bar.appendChild(chromeLeft)

  const tabsContainer = document.createElement('div')
  tabsContainer.className = 'markz-tab-list'
  bar.appendChild(tabsContainer)

  const newBtn = document.createElement('button')
  newBtn.className = 'markz-tab-new'
  newBtn.type = 'button'
  newBtn.title = 'New tab'
  newBtn.textContent = '+'
  newBtn.addEventListener('click', () => manager.newTab())
  bar.appendChild(newBtn)

  const titleBar = parent.querySelector('.markz-titlebar')
  if (titleBar?.nextSibling) {
    parent.insertBefore(bar, titleBar.nextSibling)
  } else {
    parent.insertBefore(bar, parent.firstChild)
  }

  manager.setTabsChangeListener(() => renderTabs(tabsContainer, manager))
  syncTabBarChromeState()

  return bar
}

function renderTabs(container: HTMLElement, manager: TabManager): void {
  container.innerHTML = ''
  const tabs = manager.getTabs()
  const activeId = manager.getActiveTabId()

  for (const tab of tabs) {
    container.appendChild(createTabElement(tab, tab.id === activeId, manager))
  }
}

function createTabElement(tab: TabInfo, active: boolean, manager: TabManager): HTMLElement {
  const el = document.createElement('div')
  el.className = 'markz-tab' + (active ? ' active' : '') + (tab.dirty ? ' dirty' : '')
  el.dataset.tabId = tab.id

  const label = document.createElement('span')
  label.className = 'markz-tab-label'
  label.textContent = tab.label
  el.appendChild(label)

  const close = document.createElement('button')
  close.className = 'markz-tab-close'
  close.type = 'button'
  close.title = 'Close tab'
  close.textContent = '×'
  close.addEventListener('click', (e) => {
    e.stopPropagation()
    manager.closeTab(tab.id)
  })
  el.appendChild(close)

  el.addEventListener('click', () => manager.switchTab(tab.id))

  return el
}
