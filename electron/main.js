// Mitigate MaxListenersExceededWarning from MSAL/Graph TLS sockets
require('events').EventEmitter.defaultMaxListeners = 20;

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const log = require('electron-log');

let M365Client;
try {
  M365Client = require('./m365-client');
  log.info('M365Client module loaded successfully');
} catch (error) {
  log.error('Failed to load M365Client:', error);
  M365Client = null;
}

// Configure auto-updater logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Configure for private GitHub repo
// Token should be stored in user's home directory: ~/.github-update-token
const tokenPath = path.join(app.getPath('home'), '.github-update-token');
if (fs.existsSync(tokenPath)) {
  try {
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    if (token) {
      autoUpdater.requestHeaders = {
        'Authorization': `token ${token}`
      };
      autoUpdater.logger.info('Using GitHub token for private repo updates');
    }
  } catch (error) {
    autoUpdater.logger.error('Failed to read GitHub token:', error);
  }
} else {
  autoUpdater.logger.warn('No GitHub token found. Updates from private repo will fail.');
  autoUpdater.logger.warn(`Create token file at: ${tokenPath}`);
}

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

// ============================================
// MICROSOFT 365 INTEGRATION
// ============================================

let m365Client = null;
if (M365Client) {
  try {
    m365Client = new M365Client();
    m365Client.onSessionExpired = () => {
      const wins = BrowserWindow.getAllWindows();
      wins.forEach(w => w.webContents?.send?.('m365:sessionExpired'));
    };
    log.info('M365Client instance created successfully');
  } catch (error) {
    log.error('Failed to create M365Client instance:', error);
  }
}

// IPC: Initialize M365 client
ipcMain.handle('m365:initialize', async (event, clientId, tenantId) => {
  try {
    if (!m365Client) {
      log.error('M365Client not available');
      return { success: false, error: 'M365 module not loaded. Please check logs.' };
    }
    m365Client.initialize(clientId, tenantId);
    log.info('M365 initialized with clientId:', clientId);
    return { success: true };
  } catch (error) {
    log.error('M365 initialization error:', error);
    return { success: false, error: error.message };
  }
});

// IPC: Authenticate with device code flow
ipcMain.handle('m365:authenticate', async (event) => {
  try {
    if (!m365Client) {
      log.error('M365Client not available for authentication');
      return { success: false, error: 'M365 module not loaded. Please reinstall the app.' };
    }
    
    log.info('Starting M365 authentication...');
    const result = await m365Client.authenticateWithDeviceCode(
      [
        'User.Read',
        'User.ReadWrite.All',
        'Directory.ReadWrite.All',
        'Group.ReadWrite.All',
        'AuditLog.Read.All',
        'MailboxSettings.ReadWrite'
      ],
      (deviceCodeInfo) => {
        log.info('Sending device code to renderer:', deviceCodeInfo.userCode);
        event.sender.send('m365:device-code', deviceCodeInfo);
      }
    );

    log.info('Authentication result:', result);
    return result;

  } catch (error) {
    log.error('Authentication error:', error);
    return { success: false, error: error.message };
  }
});

// IPC: Get authentication status
ipcMain.handle('m365:getAuthStatus', async () => {
  return m365Client.getAuthStatus();
});

// Notify all windows that M365 session expired (so UI shows Connect)
function notifyM365SessionExpired() {
  BrowserWindow.getAllWindows().forEach(w => w.webContents?.send?.('m365:sessionExpired'));
}

// IPC: Disconnect
ipcMain.handle('m365:disconnect', async () => {
  m365Client.disconnect();
  return { success: true };
});

// IPC: Create user (password passed separately to ensure it survives IPC)
ipcMain.handle('m365:createUser', async (event, userData, password) => {
  return await m365Client.createUser(userData, password);
});

// IPC: Reset password
ipcMain.handle('m365:resetPassword', async (event, userPrincipalName, newPassword) => {
  return await m365Client.resetUserPassword(userPrincipalName, newPassword);
});

// IPC: Assign license
ipcMain.handle('m365:assignLicense', async (event, userPrincipalName, skuId) => {
  return await m365Client.assignLicense(userPrincipalName, skuId);
});

// IPC: Add user to group
ipcMain.handle('m365:addUserToGroup', async (event, userPrincipalName, groupId) => {
  return await m365Client.addUserToGroup(userPrincipalName, groupId);
});

// IPC: Get user sign-in logs
ipcMain.handle('m365:getSignInLogs', async (event, userPrincipalName, limit) => {
  return await m365Client.getUserSignInLogs(userPrincipalName, limit);
});

// IPC: Get available licenses
ipcMain.handle('m365:getAvailableLicenses', async () => {
  return await m365Client.getAvailableLicenses();
});

// IPC: List groups
ipcMain.handle('m365:listGroups', async () => {
  return await m365Client.listGroups();
});

// IPC: Get user details
ipcMain.handle('m365:getUser', async (event, userPrincipalName) => {
  return await m365Client.getUser(userPrincipalName);
});

// ============================================
// ENHANCED USER MANAGEMENT IPC HANDLERS
// ============================================

ipcMain.handle('m365:enableUser', async (event, userPrincipalName) => {
  return await m365Client.enableUser(userPrincipalName);
});

ipcMain.handle('m365:disableUser', async (event, userPrincipalName, options) => {
  return await m365Client.disableUser(userPrincipalName, options);
});

ipcMain.handle('m365:deleteUser', async (event, userPrincipalName, permanent) => {
  return await m365Client.deleteUser(userPrincipalName, permanent);
});

ipcMain.handle('m365:updateUser', async (event, userPrincipalName, userData) => {
  return await m365Client.updateUser(userPrincipalName, userData);
});

ipcMain.handle('m365:revokeUserSessions', async (event, userPrincipalName) => {
  return await m365Client.revokeUserSessions(userPrincipalName);
});

ipcMain.handle('m365:searchUsers', async (event, searchTerm, limit) => {
  try {
    return await m365Client.searchUsers(searchTerm, limit);
  } catch (err) {
    if (err?.message?.includes('Not authenticated')) notifyM365SessionExpired();
    throw err;
  }
});

ipcMain.handle('m365:getUserDetails', async (event, userPrincipalName) => {
  return await m365Client.getUserDetails(userPrincipalName);
});

// ============================================
// ENHANCED LICENSE MANAGEMENT IPC HANDLERS
// ============================================

ipcMain.handle('m365:getUserLicenses', async (event, userPrincipalName) => {
  return await m365Client.getUserLicenses(userPrincipalName);
});

ipcMain.handle('m365:removeLicenses', async (event, userPrincipalName, skuIds) => {
  return await m365Client.removeLicenses(userPrincipalName, skuIds);
});

ipcMain.handle('m365:getLicenseReport', async () => {
  return await m365Client.getLicenseReport();
});

ipcMain.handle('m365:getUserLicenseReport', async () => {
  return await m365Client.getUserLicenseReport();
});

// ============================================
// ENHANCED GROUP MANAGEMENT IPC HANDLERS
// ============================================

ipcMain.handle('m365:removeUserFromGroup', async (event, userPrincipalName, groupId) => {
  return await m365Client.removeUserFromGroup(userPrincipalName, groupId);
});

ipcMain.handle('m365:getUserGroups', async (event, userPrincipalName) => {
  return await m365Client.getUserGroups(userPrincipalName);
});

ipcMain.handle('m365:listGroupsByType', async (event, type) => {
  return await m365Client.listGroupsByType(type);
});

// ============================================
// ENHANCED SIGN-IN LOGS IPC HANDLERS
// ============================================

ipcMain.handle('m365:getSignInLogsByDateRange', async (event, userPrincipalName, startDate, endDate, filterType) => {
  return await m365Client.getSignInLogsByDateRange(userPrincipalName, startDate, endDate, filterType);
});

// ============================================
// TENANT INFO IPC HANDLERS
// ============================================

ipcMain.handle('m365:getTenantDomains', async () => {
  return await m365Client.getTenantDomains();
});

ipcMain.handle('m365:getTenantInfo', async () => {
  return await m365Client.getTenantInfo();
});

// ============================================
// SECURITY IPC HANDLERS
// ============================================

ipcMain.handle('m365:emergencyLockdown', async (event, userPrincipalName) => {
  return await m365Client.emergencyLockdown(userPrincipalName);
});

// ============================================
// MANAGER IPC HANDLERS
// ============================================

ipcMain.handle('m365:setUserManager', async (event, userPrincipalName, managerPrincipalName) => {
  return await m365Client.setUserManager(userPrincipalName, managerPrincipalName);
});

ipcMain.handle('m365:getUserManager', async (event, userPrincipalName) => {
  return await m365Client.getUserManager(userPrincipalName);
});

// ============================================
// MAILBOX INVENTORY IPC HANDLERS
// ============================================

ipcMain.handle('m365:getMailboxInventory', async (event, options) => {
  return await m365Client.getMailboxInventory(options);
});

// ============================================
// MAIL FLOW / MESSAGE TRACE IPC HANDLERS
// ============================================

ipcMain.handle('m365:traceMessages', async (event, options) => {
  return await m365Client.traceMessages(options);
});

// ============================================
// FILE DIALOG (for CSV export)
// ============================================

// ============================================
// SCRIPTS DATA (categories + scripts)
// ============================================

function getScriptsPath() {
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    return path.join(__dirname, '..', 'src', 'data', 'scripts.json');
  }
  return path.join(app.getPath('userData'), 'scripts.json');
}

function getDefaultScriptsPath() {
  return path.join(__dirname, '..', 'src', 'data', 'scripts.json');
}

ipcMain.handle('scripts:getData', async () => {
  try {
    const userPath = getScriptsPath();
    const defaultPath = getDefaultScriptsPath();
    let data;
    if (fs.existsSync(userPath)) {
      data = JSON.parse(fs.readFileSync(userPath, 'utf8'));
    } else if (fs.existsSync(defaultPath)) {
      data = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
      if (!app.isPackaged) {
        return data;
      }
      fs.mkdirSync(path.dirname(userPath), { recursive: true });
      fs.writeFileSync(userPath, JSON.stringify(data, null, 2), 'utf8');
    } else {
      data = {};
    }
    return data;
  } catch (err) {
    log.error('scripts:getData error:', err);
    return {};
  }
});

ipcMain.handle('scripts:saveData', async (event, data) => {
  try {
    const filePath = getScriptsPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    log.error('scripts:saveData error:', err);
    return { success: false, error: err.message };
  }
});

// ============================================
// FILE DIALOG
// ============================================

ipcMain.handle('dialog:saveFile', async (event, defaultFilename, content) => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultFilename,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, path: result.filePath };
  }
  
  return { success: false, canceled: true };
});

// ============================================
// RUN POWERSHELL SCRIPT
// ============================================

ipcMain.handle('runPowerShell', async (event, scriptContent) => {
  if (!scriptContent || typeof scriptContent !== 'string') {
    return { success: false, error: 'No script content provided' };
  }
  try {
    const tempDir = app.getPath('temp');
    const scriptPath = path.join(tempDir, `GrantMailboxPerms_${Date.now()}.ps1`);
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-NoExit', '-File', scriptPath], {
      detached: true,
      stdio: 'ignore',
      shell: false
    });
    ps.unref();
    log.info('PowerShell launched:', scriptPath);
    return { success: true, path: scriptPath };
  } catch (err) {
    log.error('Run PowerShell failed:', err);
    return { success: false, error: err.message };
  }
});
