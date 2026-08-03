import type { TabManager, TabInfo } from '../editor/tabManager'

export function createTabBar(parent: HTMLElement, manager: TabManager): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'markz-tab-bar'
  bar.id = 'tab-bar'

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

  // Insert after title bar if present, else at top
  const titleBar = parent.querySelector('.markz-titlebar')
  if (titleBar?.nextSibling) {
    parent.insertBefore(bar, titleBar.nextSibling)
  } else {
    parent.insertBefore(bar, parent.firstChild)
  }

  manager.setTabsChangeListener(() => renderTabs(tabsContainer, manager))

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
