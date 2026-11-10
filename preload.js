const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize'),
  resize: (width) => ipcRenderer.send('window:resize', width),
  togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
  attention: () => ipcRenderer.send('window:attention'),
});
