import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerIPC } from './ipc'
import { buildMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let fileToOpen: string | null = null

// Handle file open from OS (double-click .md file or CLI arg)
const cliFile = process.argv.find((arg) => /\.(md|markdown|mdown)$/i.test(arg))
if (cliFile) fileToOpen = path.resolve(cliFile)

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

  registerIPC(mainWindow)
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
  })
}

// macOS: handle file open via Finder association
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('menu:open-recent', filePath)
    mainWindow.focus()
  } else {
    fileToOpen = filePath
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
