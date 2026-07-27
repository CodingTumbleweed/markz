/** macOS drag region for frameless hiddenInset title bar */
export function createTitleBar(parent: HTMLElement): HTMLElement {
  const bar = document.createElement('div')
  bar.className = 'markz-titlebar'
  bar.setAttribute('aria-hidden', 'true')
  parent.insertBefore(bar, parent.firstChild)

  if (navigator.platform.includes('Mac')) {
    document.documentElement.classList.add('platform-darwin')
  }

  return bar
}
