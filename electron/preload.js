const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
  
  // Auto-update API
  onUpdateLog: (callback) => {
    ipcRenderer.on('update-log', (event, message) => callback(message));
  },
  
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  }
});
