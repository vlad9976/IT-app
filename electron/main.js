const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Configure auto-updater logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0f172a',
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../build/icon.png')
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates after app is ready (only in production)
  if (app.isPackaged) {
    initAutoUpdater();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// =====================================================
// AUTO-UPDATER LOGIC
// =====================================================

function initAutoUpdater() {
  console.log('Initializing auto-updater...');
  
  // Event: Checking for update
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    logToRenderer('Checking for updates...');
  });

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    logToRenderer(`Update available: v${info.version}`);
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (v${info.version}) is available!`,
      detail: 'Would you like to download it now? The app will continue running during download.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        logToRenderer('Downloading update...');
      }
    });
  });

  // Event: Update not available
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version:', info.version);
    logToRenderer('App is up to date');
  });

  // Event: Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download: ${Math.round(progressObj.percent)}% (${formatBytes(progressObj.transferred)}/${formatBytes(progressObj.total)})`;
    console.log(logMessage);
    logToRenderer(logMessage);
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    logToRenderer('Update downloaded successfully');
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: `Version ${info.version} is ready to install. The app will restart to complete the installation.`,
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // User clicked "Restart Now"
        setImmediate(() => autoUpdater.quitAndInstall(false, true));
      } else {
        // User clicked "Restart Later" - will auto-install on next app quit
        logToRenderer('Update will install on next restart');
      }
    });
  });

  // Event: Error
  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    logToRenderer(`Update error: ${error.message}`);
    
    // Only show error dialog if it's not a network issue (to avoid annoying users)
    if (!error.message.includes('net::') && !error.message.includes('ENOTFOUND')) {
      dialog.showMessageBox({
        type: 'error',
        title: 'Update Error',
        message: 'Failed to check for updates',
        detail: error.message,
        buttons: ['OK']
      });
    }
  });

  // Start checking for updates
  // Check immediately on startup, then every 4 hours
  autoUpdater.checkForUpdatesAndNotify();
  
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000); // 4 hours
}

// Helper: Format bytes for download progress
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Send log messages to renderer (for debugging)
function logToRenderer(message) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-log', message);
  }
}

// IPC: Manual update check from renderer
ipcMain.on('check-for-updates', () => {
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  } else {
    console.log('Auto-update disabled in development mode');
  }
});
