import {
  BUILT_IN_THEMES,
  applyTheme, setDarkMode, applyFontSize,
  applyFontFamily, applyWritingWidth,
  getCurrentTheme, getDarkModePreference,
} from './themeManager'

let overlay: HTMLElement | null = null
type SaveCallback = (config: Record<string, unknown>) => void
let onSave: SaveCallback = () => {}

interface PrefsState {
  theme: string
  darkMode: string
  fontSize: number
  fontFamily: string
  writingWidth: number
  autoSave: boolean
  indentSize: number
  lineNumbers: boolean
}

let state: PrefsState = {
  theme: 'github',
  darkMode: 'auto',
  fontSize: 16,
  fontFamily: '',
  writingWidth: 800,
  autoSave: true,
  indentSize: 4,
  lineNumbers: false,
}

export function setPreferencesSaveCallback(cb: SaveCallback) {
  onSave = cb
}

export function loadPreferencesState(config: Record<string, unknown>) {
  const appearance = (config.appearance || {}) as Record<string, unknown>
  const general = (config.general || {}) as Record<string, unknown>
  const editor = (config.editor || {}) as Record<string, unknown>
  state = {
    theme: (appearance.theme as string) || 'github',
    darkMode: (appearance.darkMode as string) || 'auto',
    fontSize: (appearance.fontSize as number) || 16,
    fontFamily: (appearance.fontFamily as string) || '',
    writingWidth: (appearance.writingWidth as number) || 800,
    autoSave: general.autoSave !== false,
    indentSize: (editor.indentSize as number) || 4,
    lineNumbers: (editor.lineNumbers as boolean) || false,
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function createSection(title: string, content: string): string {
  return `<div class="markz-prefs-section">
    <h3 class="markz-prefs-section-title">${title}</h3>
    ${content}
  </div>`
}

function createField(label: string, input: string): string {
  return `<div class="markz-prefs-field">
    <label class="markz-prefs-label">${label}</label>
    <div class="markz-prefs-input">${input}</div>
  </div>`
}

export function openPreferences() {
  if (overlay) { closePreferences(); return }

  const themeOptions = BUILT_IN_THEMES.map(
    (t) => `<option value="${t.id}" ${state.theme === t.id ? 'selected' : ''}>${t.name}</option>`,
  ).join('')

  const darkOptions = ['auto', 'light', 'dark'].map(
    (m) => `<option value="${m}" ${state.darkMode === m ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`,
  ).join('')

  const indentOptions = [2, 4, 8].map(
    (n) => `<option value="${n}" ${state.indentSize === n ? 'selected' : ''}>${n} spaces</option>`,
  ).join('')

  const appearanceHtml = createSection('Appearance', [
    createField('Theme', `<select id="pref-theme">${themeOptions}</select>`),
    createField('Dark Mode', `<select id="pref-dark-mode">${darkOptions}</select>`),
    createField('Font Size', `<input id="pref-font-size" type="number" min="10" max="32" value="${state.fontSize}">`),
    createField('Font Family', `<input id="pref-font-family" type="text" placeholder="System default" value="${escapeHtml(state.fontFamily)}">`),
    createField('Writing Width', `<input id="pref-writing-width" type="number" min="400" max="1600" step="50" value="${state.writingWidth}">`),
  ].join(''))

  const editorHtml = createSection('Editor', [
    createField('Indent Size', `<select id="pref-indent">${indentOptions}</select>`),
    createField('Line Numbers', `<input id="pref-line-numbers" type="checkbox" ${state.lineNumbers ? 'checked' : ''}>`),
    createField('Auto Save', `<input id="pref-auto-save" type="checkbox" ${state.autoSave ? 'checked' : ''}>`),
  ].join(''))

  overlay = document.createElement('div')
  overlay.className = 'markz-prefs-overlay'
  overlay.innerHTML = `
    <div class="markz-prefs-modal">
      <div class="markz-prefs-header">
        <h2>Preferences</h2>
        <button class="markz-prefs-close" title="Close">&times;</button>
      </div>
      <div class="markz-prefs-body">
        ${appearanceHtml}
        ${editorHtml}
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  // Live-apply appearance changes
  const themeSelect = overlay.querySelector('#pref-theme') as HTMLSelectElement
  themeSelect.addEventListener('change', () => {
    state.theme = themeSelect.value
    applyTheme(state.theme)
    save()
  })

  const darkSelect = overlay.querySelector('#pref-dark-mode') as HTMLSelectElement
  darkSelect.addEventListener('change', () => {
    state.darkMode = darkSelect.value
    setDarkMode(state.darkMode as 'auto' | 'light' | 'dark')
    save()
  })

  const fontSizeInput = overlay.querySelector('#pref-font-size') as HTMLInputElement
  fontSizeInput.addEventListener('change', () => {
    state.fontSize = parseInt(fontSizeInput.value) || 16
    applyFontSize(state.fontSize)
    save()
  })

  const fontFamilyInput = overlay.querySelector('#pref-font-family') as HTMLInputElement
  fontFamilyInput.addEventListener('change', () => {
    state.fontFamily = fontFamilyInput.value
    applyFontFamily(state.fontFamily)
    save()
  })

  const widthInput = overlay.querySelector('#pref-writing-width') as HTMLInputElement
  widthInput.addEventListener('change', () => {
    state.writingWidth = parseInt(widthInput.value) || 800
    applyWritingWidth(state.writingWidth)
    save()
  })

  const lineNumbersInput = overlay.querySelector('#pref-line-numbers') as HTMLInputElement
  lineNumbersInput.addEventListener('change', () => {
    state.lineNumbers = lineNumbersInput.checked
    save()
  })

  const autoSaveInput = overlay.querySelector('#pref-auto-save') as HTMLInputElement
  autoSaveInput.addEventListener('change', () => {
    state.autoSave = autoSaveInput.checked
    save()
  })

  const indentSelect = overlay.querySelector('#pref-indent') as HTMLSelectElement
  indentSelect.addEventListener('change', () => {
    state.indentSize = parseInt(indentSelect.value) || 4
    save()
  })

  overlay.querySelector('.markz-prefs-close')?.addEventListener('click', closePreferences)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePreferences()
  })
  overlay.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape') closePreferences()
  })
}

function save() {
  onSave({
    appearance: {
      theme: state.theme,
      darkMode: state.darkMode,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
      writingWidth: state.writingWidth,
    },
    general: {
      autoSave: state.autoSave,
    },
    editor: {
      indentSize: state.indentSize,
      lineNumbers: state.lineNumbers,
    },
  })
}

export function closePreferences() {
  overlay?.remove()
  overlay = null
}
