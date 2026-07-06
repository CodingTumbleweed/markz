export interface DirEntry {
  name: string
  path: string
  isDir: boolean
}

export interface FileStat {
  mtime: number
  size: number
}

export interface ImageInsertResult {
  markdownPath: string
  absolutePath: string
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>

  openFile: () => Promise<{ filePath: string; content: string } | null>
  saveFile: (content: string, filePath?: string) => Promise<string | null>
  saveFileAs: (content: string) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  createFile: (filePath: string) => Promise<boolean>
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>
  deleteFile: (filePath: string) => Promise<boolean>
  fileStat: (filePath: string) => Promise<FileStat | null>

  openFolder: () => Promise<string | null>
  listDirectory: (dirPath: string) => Promise<DirEntry[]>
  listAllFiles: (dirPath: string) => Promise<string[]>
  watchFolder: (dirPath: string) => Promise<boolean>
  unwatchFolder: (dirPath: string) => Promise<boolean>
  onFolderChanged: (callback: (dirPath: string, eventType: string, filename: string) => void) => void

  getConfig: () => Promise<Record<string, unknown>>
  setConfig: (config: Record<string, unknown>) => Promise<Record<string, unknown>>

  openImageDialog: () => Promise<string | null>
  copyImageToAssets: (imagePath: string, documentPath: string, assetsFolder?: string) => Promise<ImageInsertResult>
  pasteClipboardImage: (documentPath: string, assetsFolder?: string) => Promise<ImageInsertResult | null>
  getImageRelativePath: (imagePath: string, documentPath: string) => Promise<string>

  exportPDF: (html: string, css: string, options?: Record<string, unknown>) => Promise<string | null>
  exportHTML: (html: string, css: string, title?: string) => Promise<string | null>

  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  onMenuAction: (callback: (action: string, ...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
