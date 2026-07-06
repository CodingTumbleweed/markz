import { Menu, BrowserWindow, app } from 'electron'
import { loadConfig } from './config'

export function buildMenu(win: BrowserWindow): void {
  const isMac = process.platform === 'darwin'
  const config = loadConfig()
  const recentFiles = config.recentFiles || []

  const recentSubmenu: Electron.MenuItemConstructorOptions[] = recentFiles.length > 0
    ? [
        ...recentFiles.slice(0, 10).map((f) => ({
          label: f.split('/').pop() || f,
          sublabel: f,
          click: () => win.webContents.send('menu:open-recent', f),
        })),
        { type: 'separator' as const },
        {
          label: 'Clear Recent',
          click: () => win.webContents.send('menu:clear-recent'),
        },
      ]
    : [{ label: 'No Recent Files', enabled: false }]

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Preferences…',
          accelerator: 'Cmd+,',
          click: () => win.webContents.send('menu:preferences'),
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('menu:new'),
        },
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => win.webContents.send('menu:open'),
        },
        {
          label: 'Open Folder…',
          click: () => win.webContents.send('menu:open-folder'),
        },
        {
          label: 'Open Quickly…',
          accelerator: 'CmdOrCtrl+P',
          click: () => win.webContents.send('menu:open-quickly'),
        },
        { type: 'separator' },
        {
          label: 'Open Recent',
          submenu: recentSubmenu,
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu:save'),
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win.webContents.send('menu:save-as'),
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'PDF…',
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => win.webContents.send('menu:export-pdf'),
            },
            {
              label: 'HTML…',
              click: () => win.webContents.send('menu:export-html'),
            },
          ],
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { type: 'separator' as const },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => win.webContents.send('menu:find'),
        },
        {
          label: 'Find and Replace',
          accelerator: isMac ? 'Cmd+Alt+F' : 'Ctrl+H',
          click: () => win.webContents.send('menu:replace'),
        },
        { role: 'selectAll' as const },
        { type: 'separator' as const },
        ...(!isMac ? [{
          label: 'Preferences…',
          accelerator: 'Ctrl+,' as const,
          click: () => win.webContents.send('menu:preferences'),
        }] : []),
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Command Palette…',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => win.webContents.send('menu:command-palette'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+\\',
          click: () => win.webContents.send('menu:toggle-sidebar'),
        },
        {
          label: 'Toggle Outline',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => win.webContents.send('menu:toggle-outline'),
        },
        { type: 'separator' },
        {
          label: 'Source Code Mode',
          accelerator: 'CmdOrCtrl+/',
          click: () => win.webContents.send('menu:toggle-source'),
        },
        {
          label: 'Focus Mode',
          click: () => win.webContents.send('menu:toggle-focus'),
        },
        {
          label: 'Typewriter Mode',
          click: () => win.webContents.send('menu:toggle-typewriter'),
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const level = win.webContents.getZoomLevel()
            win.webContents.setZoomLevel(level + 0.5)
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const level = win.webContents.getZoomLevel()
            win.webContents.setZoomLevel(level - 0.5)
          },
        },
        {
          label: 'Reset Zoom',
          click: () => {
            win.webContents.setZoomLevel(0)
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
        { type: 'separator' },
        { role: 'toggleDevTools' as const },
      ],
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => win.webContents.send('menu:format', 'bold'),
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => win.webContents.send('menu:format', 'italic'),
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+Shift+X',
          click: () => win.webContents.send('menu:format', 'strikethrough'),
        },
        { type: 'separator' },
        {
          label: 'Heading 1',
          accelerator: 'CmdOrCtrl+1',
          click: () => win.webContents.send('menu:format', 'h1'),
        },
        {
          label: 'Heading 2',
          accelerator: 'CmdOrCtrl+2',
          click: () => win.webContents.send('menu:format', 'h2'),
        },
        {
          label: 'Heading 3',
          accelerator: 'CmdOrCtrl+3',
          click: () => win.webContents.send('menu:format', 'h3'),
        },
        { type: 'separator' },
        {
          label: 'Insert Image…',
          click: () => win.webContents.send('menu:insert-image'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
