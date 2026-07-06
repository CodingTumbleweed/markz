import '../themes/github.css'
import '../themes/newsprint.css'
import '../themes/minimal.css'

export interface ThemeInfo {
  id: string
  name: string
}

export const BUILT_IN_THEMES: ThemeInfo[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'newsprint', name: 'Newsprint' },
  { id: 'minimal', name: 'Minimal' },
]

let currentTheme = 'github'
let darkModePreference: 'auto' | 'light' | 'dark' = 'auto'
let mediaQuery: MediaQueryList | null = null

export function applyTheme(themeId: string) {
  currentTheme = themeId
  document.documentElement.setAttribute('data-theme', themeId)
  updateDarkClass()
}

export function setDarkMode(mode: 'auto' | 'light' | 'dark') {
  darkModePreference = mode
  updateDarkClass()
}

function updateDarkClass() {
  let isDark = false
  if (darkModePreference === 'dark') {
    isDark = true
  } else if (darkModePreference === 'auto') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  document.documentElement.classList.toggle('dark', isDark)
  document.body.classList.toggle('markz-dark', isDark)
}

export function applyFontSize(size: number) {
  document.documentElement.style.setProperty('--markz-font-size', `${size}px`)
}

export function applyFontFamily(family: string) {
  if (family) {
    document.documentElement.style.setProperty('--markz-font-family', family)
  } else {
    document.documentElement.style.removeProperty('--markz-font-family')
  }
}

export function applyWritingWidth(width: number) {
  document.documentElement.style.setProperty('--markz-content-width', `${width}px`)
}

export function initThemeSystem() {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (darkModePreference === 'auto') updateDarkClass()
  })
}

export function getCurrentTheme(): string {
  return currentTheme
}

export function getDarkModePreference(): string {
  return darkModePreference
}
