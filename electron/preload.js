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
  },

  // Microsoft 365 API
  m365: {
    initialize: (clientId, tenantId) => ipcRenderer.invoke('m365:initialize', clientId, tenantId),
    authenticate: () => ipcRenderer.invoke('m365:authenticate'),
    getAuthStatus: () => ipcRenderer.invoke('m365:getAuthStatus'),
    disconnect: () => ipcRenderer.invoke('m365:disconnect'),
    
    onDeviceCode: (callback) => {
      ipcRenderer.on('m365:device-code', (event, deviceCodeInfo) => callback(deviceCodeInfo));
    },
    onSessionExpired: (callback) => {
      ipcRenderer.on('m365:sessionExpired', () => callback());
    },
    
    // User Management
    createUser: (userData, password) => ipcRenderer.invoke('m365:createUser', userData, password),
    enableUser: (userPrincipalName) => ipcRenderer.invoke('m365:enableUser', userPrincipalName),
    disableUser: (userPrincipalName, options) => ipcRenderer.invoke('m365:disableUser', userPrincipalName, options),
    deleteUser: (userPrincipalName, permanent) => ipcRenderer.invoke('m365:deleteUser', userPrincipalName, permanent),
    updateUser: (userPrincipalName, userData) => ipcRenderer.invoke('m365:updateUser', userPrincipalName, userData),
    resetPassword: (userPrincipalName, newPassword) => ipcRenderer.invoke('m365:resetPassword', userPrincipalName, newPassword),
    revokeUserSessions: (userPrincipalName) => ipcRenderer.invoke('m365:revokeUserSessions', userPrincipalName),
    searchUsers: (searchTerm, limit) => ipcRenderer.invoke('m365:searchUsers', searchTerm, limit),
    getUser: (userPrincipalName) => ipcRenderer.invoke('m365:getUser', userPrincipalName),
    getUserDetails: (userPrincipalName) => ipcRenderer.invoke('m365:getUserDetails', userPrincipalName),
    getMailboxInfo: (userPrincipalName) => ipcRenderer.invoke('m365:getMailboxInfo', userPrincipalName),
    
    // License Management
    assignLicense: (userPrincipalName, skuId) => ipcRenderer.invoke('m365:assignLicense', userPrincipalName, skuId),
    getUserLicenses: (userPrincipalName) => ipcRenderer.invoke('m365:getUserLicenses', userPrincipalName),
    removeLicenses: (userPrincipalName, skuIds) => ipcRenderer.invoke('m365:removeLicenses', userPrincipalName, skuIds),
    getAvailableLicenses: () => ipcRenderer.invoke('m365:getAvailableLicenses'),
    getLicenseReport: () => ipcRenderer.invoke('m365:getLicenseReport'),
    getUserLicenseReport: () => ipcRenderer.invoke('m365:getUserLicenseReport'),
    
    // Group Management
    addUserToGroup: (userPrincipalName, groupId) => ipcRenderer.invoke('m365:addUserToGroup', userPrincipalName, groupId),
    removeUserFromGroup: (userPrincipalName, groupId) => ipcRenderer.invoke('m365:removeUserFromGroup', userPrincipalName, groupId),
    getUserGroups: (userPrincipalName) => ipcRenderer.invoke('m365:getUserGroups', userPrincipalName),
    listGroups: () => ipcRenderer.invoke('m365:listGroups'),
    listGroupsByType: (type) => ipcRenderer.invoke('m365:listGroupsByType', type),
    
    // Sign-in Logs
    getSignInLogs: (userPrincipalName, limit) => ipcRenderer.invoke('m365:getSignInLogs', userPrincipalName, limit),
    getSignInLogsByDateRange: (userPrincipalName, startDate, endDate, filterType) => 
      ipcRenderer.invoke('m365:getSignInLogsByDateRange', userPrincipalName, startDate, endDate, filterType),
    
    // Tenant Info
    getTenantDomains: () => ipcRenderer.invoke('m365:getTenantDomains'),
    getTenantInfo: () => ipcRenderer.invoke('m365:getTenantInfo'),
    
    // Security
    emergencyLockdown: (userPrincipalName) => ipcRenderer.invoke('m365:emergencyLockdown', userPrincipalName),
    
    // Manager Operations
    setUserManager: (userPrincipalName, managerPrincipalName) => ipcRenderer.invoke('m365:setUserManager', userPrincipalName, managerPrincipalName),
    getUserManager: (userPrincipalName) => ipcRenderer.invoke('m365:getUserManager', userPrincipalName),

    // Mailbox Inventory
    getMailboxInventory: (options) => ipcRenderer.invoke('m365:getMailboxInventory', options),

    // Mail Flow / Message Trace
    traceMessages: (options) => ipcRenderer.invoke('m365:traceMessages', options)
  },

  // SharePoint Projects (ITProjects list)
  projects: {
    getSiteRoot: () => ipcRenderer.invoke('projects:getSiteRoot'),
    getListId: (siteId) => ipcRenderer.invoke('projects:getListId', siteId),
    getAll: (options) => ipcRenderer.invoke('projects:getAll', options),
    getOne: (siteId, listId, itemId) => ipcRenderer.invoke('projects:getOne', siteId, listId, itemId),
    create: (project, options) => ipcRenderer.invoke('projects:create', project, options),
    update: (siteId, listId, itemId, updates, options) => ipcRenderer.invoke('projects:update', siteId, listId, itemId, updates, options),
    delete: (siteId, listId, itemId) => ipcRenderer.invoke('projects:delete', siteId, listId, itemId)
  },

  // Scripts data (categories + scripts)
  getScriptsData: () => ipcRenderer.invoke('scripts:getData'),
  saveScriptsData: (data) => ipcRenderer.invoke('scripts:saveData', data),

  // File dialog for CSV export
  saveFileDialog: (defaultFilename, content) => ipcRenderer.invoke('dialog:saveFile', defaultFilename, content),

  // Run PowerShell script (opens new window)
  runPowerShell: (scriptContent) => ipcRenderer.invoke('runPowerShell', scriptContent)
});
