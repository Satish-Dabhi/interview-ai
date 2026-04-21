const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV !== 'production'
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 440,
    height: 640,
    minWidth: 320,
    minHeight: 200,
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Ctrl+Shift+M — toggle microphone from anywhere
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    mainWindow?.webContents.send('toggle-mic')
  })

  // Ctrl+Shift+H — hide / show the window
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else mainWindow?.show()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

ipcMain.on('minimize-window', () => mainWindow?.minimize())
ipcMain.on('close-window', () => mainWindow?.close())
ipcMain.on('set-always-on-top', (_, val) => mainWindow?.setAlwaysOnTop(val))
ipcMain.on('set-compact', (_, compact) => {
  if (compact) mainWindow?.setSize(380, 180)
  else mainWindow?.setSize(440, 640)
})
