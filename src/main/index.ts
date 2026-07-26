import { app, BrowserWindow, nativeImage } from 'electron'
import path from 'path'
import { registerIPC, setIPCMainWindow } from './ipc'
import { buildMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let fileToOpen: string | null = null

const MD_FILE = /\.(md|markdown|mdown)$/i

function openFileInWindow(filePath: string): void {
  const resolved = path.resolve(filePath)
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('menu:open-recent', resolved)
  } else {
    fileToOpen = resolved
    // Window was closed (Cmd+W) but app still running — recreate so Finder Open With works
    if (app.isReady()) {
      createWindow()
    }
  }
}

function focusMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  setIPCMainWindow(mainWindow)
  buildMenu(mainWindow)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.webContents.session.setSpellCheckerLanguages(['en-US'])

    if (fileToOpen) {
      mainWindow?.webContents.send('menu:open-recent', fileToOpen)
      fileToOpen = null
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    setIPCMainWindow(null)
  })
}

function setDevDockIcon(): void {
  if (process.platform === 'darwin' && process.env.VITE_DEV_SERVER_URL) {
    const iconPath = path.join(__dirname, '../../build/icon.png')
    const image = nativeImage.createFromPath(iconPath)
    if (!image.isEmpty()) {
      app.dock?.setIcon(image)
    }
  }
}

// Handle file open from OS (double-click .md file or CLI arg)
const cliFile = process.argv.find((arg) => MD_FILE.test(arg))
if (cliFile) fileToOpen = path.resolve(cliFile)

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const mdArg = commandLine.find((arg) => MD_FILE.test(arg))
    if (mdArg) {
      openFileInWindow(mdArg)
    } else {
      focusMainWindow()
    }
  })

  // macOS: handle file open via Finder association
  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    openFileInWindow(filePath)
  })

  app.whenReady().then(() => {
    setDevDockIcon()
    registerIPC()
    createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow) {
      focusMainWindow()
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}
