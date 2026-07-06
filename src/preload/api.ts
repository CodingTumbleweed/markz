import { ipcRenderer, webFrame } from 'electron'
import type { ElectronAPI } from '../shared/types'

export const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app:version'),

  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, filePath?) => ipcRenderer.invoke('file:save', content, filePath),
  saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  createFile: (filePath) => ipcRenderer.invoke('file:create', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('file:rename', oldPath, newPath),
  deleteFile: (filePath) => ipcRenderer.invoke('file:delete', filePath),
  fileStat: (filePath) => ipcRenderer.invoke('file:stat', filePath),

  openFolder: () => ipcRenderer.invoke('folder:open'),
  listDirectory: (dirPath) => ipcRenderer.invoke('folder:list', dirPath),
  listAllFiles: (dirPath) => ipcRenderer.invoke('folder:list-all', dirPath),
  watchFolder: (dirPath) => ipcRenderer.invoke('folder:watch', dirPath),
  unwatchFolder: (dirPath) => ipcRenderer.invoke('folder:unwatch', dirPath),
  onFolderChanged: (callback) => {
    ipcRenderer.on('folder:changed', (_event, dirPath, eventType, filename) => {
      callback(dirPath, eventType, filename)
    })
  },

  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config) => ipcRenderer.invoke('config:set', config),

  openImageDialog: () => ipcRenderer.invoke('image:open-dialog'),
  copyImageToAssets: (imagePath, documentPath, assetsFolder?) =>
    ipcRenderer.invoke('image:copy-to-assets', imagePath, documentPath, assetsFolder),
  pasteClipboardImage: (documentPath, assetsFolder?) =>
    ipcRenderer.invoke('image:paste-clipboard', documentPath, assetsFolder),
  getImageRelativePath: (imagePath, documentPath) =>
    ipcRenderer.invoke('image:relative-path', imagePath, documentPath),

  exportPDF: (html, css, options?) => ipcRenderer.invoke('export:pdf', html, css, options),
  exportHTML: (html, css, title?) => ipcRenderer.invoke('export:html', html, css, title),

  zoomIn: () => webFrame.setZoomLevel(webFrame.getZoomLevel() + 0.5),
  zoomOut: () => webFrame.setZoomLevel(webFrame.getZoomLevel() - 0.5),
  resetZoom: () => webFrame.setZoomLevel(0),

  onMenuAction: (callback) => {
    const channels = [
      'menu:new', 'menu:open', 'menu:save', 'menu:save-as',
      'menu:find', 'menu:replace', 'menu:toggle-source', 'menu:format',
      'menu:export-pdf', 'menu:export-html',
      'menu:open-folder', 'menu:toggle-sidebar', 'menu:toggle-outline',
      'menu:open-quickly', 'menu:open-recent', 'menu:clear-recent',
      'menu:command-palette', 'menu:toggle-focus', 'menu:toggle-typewriter',
      'menu:preferences', 'menu:insert-image',
    ]
    channels.forEach((channel) => {
      ipcRenderer.on(channel, (_event, ...args) => {
        callback(channel.replace('menu:', ''), ...args)
      })
    })
  },
}
