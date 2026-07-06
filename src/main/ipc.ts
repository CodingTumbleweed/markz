import { ipcMain, BrowserWindow, app } from 'electron'
import {
  openFileDialog, openFolderDialog, saveFileDialog,
  readFile, writeFile, listDirectory, collectAllFiles,
  createFile, renameFile, deleteFile, getFileStat,
} from './fileSystem'
import {
  openImageDialog, copyImageToAssetsFolder, saveClipboardImage, getRelativePath,
} from './imageHandler'
import { loadConfig, saveConfig, addRecentFile, MarkzConfig } from './config'
import { exportToPDF } from './export/pdf'
import { exportToHTML } from './export/html'
import fs from 'fs'

let config: MarkzConfig
const watchers = new Map<string, fs.FSWatcher>()

export function registerIPC(win: BrowserWindow): void {
  config = loadConfig()

  ipcMain.handle('app:version', () => app.getVersion())

  ipcMain.handle('file:open', async () => {
    const result = await openFileDialog(win)
    if (result) {
      config = addRecentFile(config, result.filePath)
      saveConfig(config)
    }
    return result
  })

  ipcMain.handle('file:save', async (_event, content: string, filePath?: string) => {
    const savedPath = await saveFileDialog(win, content, filePath)
    if (savedPath) {
      config = addRecentFile(config, savedPath)
      saveConfig(config)
    }
    return savedPath
  })

  ipcMain.handle('file:save-as', async (_event, content: string) => {
    const savedPath = await saveFileDialog(win, content)
    if (savedPath) {
      config = addRecentFile(config, savedPath)
      saveConfig(config)
    }
    return savedPath
  })

  ipcMain.handle('file:read', (_event, filePath: string) => {
    return readFile(filePath)
  })

  ipcMain.handle('file:write', (_event, filePath: string, content: string) => {
    writeFile(filePath, content)
    return true
  })

  ipcMain.handle('file:create', (_event, filePath: string) => {
    createFile(filePath)
    return true
  })

  ipcMain.handle('file:rename', (_event, oldPath: string, newPath: string) => {
    renameFile(oldPath, newPath)
    return true
  })

  ipcMain.handle('file:delete', async (_event, filePath: string) => {
    await deleteFile(filePath)
    return true
  })

  ipcMain.handle('file:stat', (_event, filePath: string) => {
    return getFileStat(filePath)
  })

  ipcMain.handle('folder:open', async () => {
    return openFolderDialog(win)
  })

  ipcMain.handle('folder:list', (_event, dirPath: string) => {
    return listDirectory(dirPath)
  })

  ipcMain.handle('folder:list-all', (_event, dirPath: string) => {
    return collectAllFiles(dirPath)
  })

  ipcMain.handle('folder:watch', (_event, dirPath: string) => {
    if (watchers.has(dirPath)) return true
    try {
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename && !filename.startsWith('.')) {
          win.webContents.send('folder:changed', dirPath, eventType, filename)
        }
      })
      watchers.set(dirPath, watcher)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('folder:unwatch', (_event, dirPath: string) => {
    const watcher = watchers.get(dirPath)
    if (watcher) {
      watcher.close()
      watchers.delete(dirPath)
    }
    return true
  })

  ipcMain.handle('image:open-dialog', async () => {
    return openImageDialog(win)
  })

  ipcMain.handle('image:copy-to-assets', (_event, imagePath: string, documentPath: string, assetsFolder?: string) => {
    return copyImageToAssetsFolder(imagePath, documentPath, assetsFolder)
  })

  ipcMain.handle('image:paste-clipboard', (_event, documentPath: string, assetsFolder?: string) => {
    return saveClipboardImage(documentPath, assetsFolder)
  })

  ipcMain.handle('image:relative-path', (_event, imagePath: string, documentPath: string) => {
    return getRelativePath(imagePath, documentPath)
  })

  ipcMain.handle('config:get', () => config)

  ipcMain.handle('config:set', (_event, newConfig: Partial<MarkzConfig>) => {
    config = { ...config, ...newConfig }
    saveConfig(config)
    return config
  })

  ipcMain.handle('export:pdf', async (_event, markdown: string, css: string, options?: Record<string, unknown>) => {
    return exportToPDF(win, markdown, css, options as any)
  })

  ipcMain.handle('export:html', async (_event, markdown: string, css: string, title?: string) => {
    return exportToHTML(win, markdown, css, title)
  })
}
