import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const CONFIG_DIR = path.join(app.getPath('home'), '.markz')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

export interface MarkzConfig {
  general: {
    autoSave: boolean
    autoSaveInterval: number
  }
  appearance: {
    theme: string
    darkMode: 'auto' | 'light' | 'dark'
    fontSize: number
    fontFamily: string
    writingWidth: number
  }
  editor: {
    indentSize: number
    wordWrap: boolean
    lineNumbers: boolean
  }
  recentFiles: string[]
}

const defaultConfig: MarkzConfig = {
  general: {
    autoSave: true,
    autoSaveInterval: 5000,
  },
  appearance: {
    theme: 'github',
    darkMode: 'auto',
    fontSize: 16,
    fontFamily: '',
    writingWidth: 800,
  },
  editor: {
    indentSize: 4,
    wordWrap: true,
    lineNumbers: false,
  },
  recentFiles: [],
}

export function loadConfig(): MarkzConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
      return { ...defaultConfig, ...JSON.parse(raw) }
    }
  } catch {
    // Fall through to default
  }
  return { ...defaultConfig }
}

export function saveConfig(config: MarkzConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function addRecentFile(config: MarkzConfig, filePath: string): MarkzConfig {
  const recent = config.recentFiles.filter((f) => f !== filePath)
  recent.unshift(filePath)
  if (recent.length > 20) recent.length = 20
  return { ...config, recentFiles: recent }
}
