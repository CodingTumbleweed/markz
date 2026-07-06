import { dialog, BrowserWindow, shell } from 'electron'
import fs from 'fs'
import path from 'path'

export interface DirEntry {
  name: string
  path: string
  isDir: boolean
}

export async function openFileDialog(win: BrowserWindow): Promise<{ filePath: string; content: string } | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const filePath = result.filePaths[0]
  const content = fs.readFileSync(filePath, 'utf-8')
  return { filePath, content }
}

export async function openFolderDialog(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export async function saveFileDialog(win: BrowserWindow, content: string, currentPath?: string): Promise<string | null> {
  if (currentPath) {
    fs.writeFileSync(currentPath, content, 'utf-8')
    return currentPath
  }

  const result = await dialog.showSaveDialog(win, {
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || !result.filePath) return null

  fs.writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
}

export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function listDirectory(dirPath: string): DirEntry[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => ({
      name: e.name,
      path: path.join(dirPath, e.name),
      isDir: e.isDirectory(),
    }))
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })
}

export function collectAllFiles(dirPath: string): string[] {
  const results: string[] = []
  function walk(dir: string) {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        walk(full)
      } else {
        results.push(full)
      }
    }
  }
  walk(dirPath)
  return results
}

export function createFile(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, '', 'utf-8')
}

export function renameFile(oldPath: string, newPath: string): void {
  fs.renameSync(oldPath, newPath)
}

export async function deleteFile(filePath: string): Promise<void> {
  await shell.trashItem(filePath)
}

export function getFileStat(filePath: string): { mtime: number; size: number } | null {
  try {
    const stat = fs.statSync(filePath)
    return { mtime: stat.mtimeMs, size: stat.size }
  } catch {
    return null
  }
}
