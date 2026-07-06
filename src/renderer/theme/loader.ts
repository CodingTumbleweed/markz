const THEME_KEY = 'markz-active-theme'

let currentThemeLink: HTMLLinkElement | null = null

export function loadTheme(name: string): void {
  if (currentThemeLink) {
    currentThemeLink.remove()
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `./themes/${name}.css`
  link.id = THEME_KEY
  document.head.appendChild(link)
  currentThemeLink = link
}

export function applyDarkMode(mode: 'auto' | 'light' | 'dark'): void {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else if (mode === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
    root.classList.toggle('light', !prefersDark)
  }
}

export function setFontSize(size: number): void {
  document.documentElement.style.setProperty('--markz-font-size', `${size}px`)
}
