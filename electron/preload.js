const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  setAlwaysOnTop: (val) => ipcRenderer.send('set-always-on-top', val),
  setCompact: (val) => ipcRenderer.send('set-compact', val),
  onToggleMic: (cb) => ipcRenderer.on('toggle-mic', cb),
  removeListeners: () => ipcRenderer.removeAllListeners('toggle-mic')
})
