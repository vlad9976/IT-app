const path = require('path');
const { Client } = require('@microsoft/microsoft-graph-client');
const { PublicClientApplication } = require('@azure/msal-node');
const log = require('electron-log');
require('isomorphic-fetch');

let DataProtectionScope;
let PersistenceCreator;
let PersistenceCachePlugin;
try {
  const ext = require('@azure/msal-node-extensions');
  DataProtectionScope = ext.DataProtectionScope;
  PersistenceCreator = ext.PersistenceCreator;
  PersistenceCachePlugin = ext.PersistenceCachePlugin;
} catch (e) {
  log.warn('MSAL node extensions not available, token cache will not persist:', e.message);
}

const SCOPES = [
  'User.Read',
  'User.ReadWrite.All',
  'User-PasswordProfile.ReadWrite.All',
  'Directory.ReadWrite.All',
  'Group.ReadWrite.All',
  'AuditLog.Read.All',
  'MailboxSettings.ReadWrite',
  'Mail.Read',
  'Sites.ReadWrite.All',
  'Sites.Manage.All'
];

const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

class M365Client {
  constructor() {
    this.msalClient = null;
    this.graphClient = null;
    this.accessToken = null;
    this.account = null;
    this.config = null;
    this.onSessionExpired = null;
    this.tokenAcquiredAt = null;
    this.refreshIntervalId = null;
  }

  async initialize(clientId, tenantId = 'common', cacheDir = null) {
    if (this.msalClient) {
      return;
    }
    this.config = {
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`
      }
    };

    if (cacheDir && PersistenceCreator && PersistenceCachePlugin && DataProtectionScope) {
      try {
        const cachePath = path.join(cacheDir, 'msal-cache.json');
        const persistence = await PersistenceCreator.createPersistence({
          cachePath,
          dataProtectionScope: DataProtectionScope.CurrentUser,
          serviceName: 'IT Script Generator',
          accountName: 'M365',
          usePlaintextFileOnLinux: false
        });
        this.config.cache = { cachePlugin: new PersistenceCachePlugin(persistence) };
        log.info('M365 cache persistence enabled:', cachePath);
      } catch (e) {
        log.warn('Cache persistence setup failed, using in-memory cache:', e.message);
      }
    }

    this.msalClient = new PublicClientApplication(this.config);
    log.info('M365 Client initialized');

    if (this.config.cache) {
      try {
        const restored = await this.tryRestoreSession();
        if (restored) log.info('M365 session restored from cache');
      } catch (e) {
        log.warn('Session restore failed:', e.message);
      }
    }
  }

  startRefreshTimer() {
    this.stopRefreshTimer();
    this.refreshIntervalId = setInterval(() => {
      if (!this.account) return;
      this.acquireTokenSilent().then(() => {
        log.info('Token refreshed proactively');
      }).catch((e) => {
        if (/InteractionRequired|consent|AADSTS65001/i.test(e.message || '')) {
          this.stopRefreshTimer();
          this.disconnect();
          if (typeof this.onSessionExpired === 'function') this.onSessionExpired();
        }
        log.warn('Proactive token refresh failed:', e.message);
      });
    }, REFRESH_INTERVAL_MS);
  }

  stopRefreshTimer() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }
  }

  async tryRestoreSession() {
    if (!this.msalClient) return false;
    try {
      const accounts = await this.msalClient.getAllAccounts();
      if (!accounts || accounts.length === 0) return false;
      this.account = accounts[0];
      await this.acquireTokenSilent();
      this.graphClient = Client.init({
        authProvider: (done) => { done(null, this.accessToken); }
      });
      this.startRefreshTimer();
      return true;
    } catch (e) {
      log.warn('Could not restore session from cache:', e.message);
      this.account = null;
      this.accessToken = null;
      this.graphClient = null;
      return false;
    }
  }

  async authenticateWithDeviceCode(scopes, deviceCodeCallback) {
    try {
      log.info('Starting device code flow authentication');

      const deviceCodeRequest = {
        deviceCodeCallback: (response) => {
          log.info('Device code received:', response.userCode);
          
          if (deviceCodeCallback) {
            deviceCodeCallback({
              userCode: response.userCode,
              verificationUri: response.verificationUri,
              message: response.message,
              expiresIn: response.expiresIn
            });
          }
        },
        scopes: scopes || SCOPES
      };

      const response = await this.msalClient.acquireTokenByDeviceCode(deviceCodeRequest);
      
      this.accessToken = response.accessToken;
      this.account = response.account;
      this.tokenAcquiredAt = Date.now();

      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, this.accessToken);
        }
      });

      this.startRefreshTimer();
      log.info('Authentication successful for:', this.account.username);
      
      return {
        success: true,
        username: this.account.username,
        tenantId: this.account.tenantId
      };

    } catch (error) {
      log.error('Authentication failed:', error);
      
      // Provide more detailed error information
      let errorMessage = error.message || 'Authentication failed';
      
      if (error.errorCode === 'invalid_grant') {
        errorMessage = 'Authentication failed. Possible causes:\n' +
          '1. Device code expired (15 min timeout)\n' +
          '2. Wrong tenant - check if app is single-tenant\n' +
          '3. User cancelled authentication\n' +
          '4. Conditional access policy blocking\n\n' +
          'Original error: ' + error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: error.errorCode,
        errorDetails: error.errorMessage
      };
    }
  }

  async acquireTokenSilent() {
    if (!this.account) {
      throw new Error('No account available. Please authenticate first.');
    }

    try {
      const silentRequest = {
        account: this.account,
        scopes: SCOPES
      };

      const response = await this.msalClient.acquireTokenSilent(silentRequest);
      this.accessToken = response.accessToken;
      this.tokenAcquiredAt = Date.now();
      
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, this.accessToken);
        }
      });

      return true;
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('AADSTS65001') || msg.includes('InteractionRequired') || msg.includes('consent')) {
        log.warn('Silent token failed - interactive re-auth required');
        this.disconnect();
        if (typeof this.onSessionExpired === 'function') this.onSessionExpired();
        const friendly = new Error(
          'Your session must be refreshed. Admin consent was granted, but you need to sign in again. ' +
          'Click Disconnect, then Connect to complete a new sign-in with device code.'
        );
        friendly.name = error.name;
        throw friendly;
      }
      log.warn('Silent token acquisition failed:', msg);
      throw error;
    }
  }

  isAuthenticated() {
    return this.accessToken !== null && this.account !== null;
  }

  getAuthStatus() {
    if (this.isAuthenticated()) {
      return {
        authenticated: true,
        username: this.account.username,
        tenantId: this.account.tenantId
      };
    }
    return { authenticated: false };
  }

  disconnect() {
    this.stopRefreshTimer();
    this.accessToken = null;
    this.account = null;
    this.graphClient = null;
    this.tokenAcquiredAt = null;
    log.info('Disconnected from Microsoft 365');
  }

  async createUser(userData, explicitPassword) {
    await this.ensureAuthenticated();

    try {
      const password = explicitPassword ?? userData.passwordProfile?.password ?? userData.password;
      if (!password || typeof password !== 'string' || password.length < 8) {
        return { success: false, error: { message: 'A password must be specified to create a new user. (Min 8 characters)' } };
      }

      const body = {
        accountEnabled: userData.accountEnabled !== false,
        displayName: userData.displayName,
        mailNickname: userData.mailNickname || userData.userPrincipalName.split('@')[0],
        userPrincipalName: userData.userPrincipalName,
        passwordProfile: {
          forceChangePasswordNextSignIn: userData.passwordProfile?.forceChangePasswordNextSignIn !== false,
          password: String(password)
        },
        usageLocation: userData.usageLocation || 'US'
      };

      // Use raw fetch instead of Graph SDK to avoid any potential request body filtering
      const res = await fetch('https://graph.microsoft.com/v1.0/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const responseText = await res.text();
      if (!res.ok) {
        let parsed;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          throw new Error(responseText || `HTTP ${res.status}`);
        }
        const err = new Error(parsed.error?.message || responseText);
        err.statusCode = res.status;
        err.body = responseText;
        throw err;
      }

      const result = JSON.parse(responseText);
      log.info('User created:', result.userPrincipalName);
      return { success: true, data: result };

    } catch (error) {
      log.error('Create user failed:', error);
      return this.handleError(error);
    }
  }

  async resetUserPassword(userPrincipalName, newPassword) {
    await this.ensureAuthenticated();

    try {
      const passwordProfile = {
        forceChangePasswordNextSignIn: true,
        password: newPassword
      };

      await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .update({ passwordProfile });

      log.info('Password reset for:', userPrincipalName);
      return { success: true, message: 'Password reset successfully' };

    } catch (error) {
      log.error('Reset password failed:', error);
      return this.handleError(error);
    }
  }

  async assignLicense(userPrincipalName, skuId) {
    await this.ensureAuthenticated();

    try {
      const licenseRequest = {
        addLicenses: [
          {
            skuId: skuId
          }
        ],
        removeLicenses: []
      };

      await this.graphClient
        .api(`/users/${userPrincipalName}/assignLicense`)
        .post(licenseRequest);

      log.info('License assigned to:', userPrincipalName);
      return { success: true, message: 'License assigned successfully' };

    } catch (error) {
      log.error('Assign license failed:', error);
      return this.handleError(error);
    }
  }

  async addUserToGroup(userPrincipalName, groupId) {
    await this.ensureAuthenticated();

    try {
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id')
        .get();

      await this.graphClient
        .api(`/groups/${groupId}/members/$ref`)
        .post({
          '@odata.id': `https://graph.microsoft.com/v1.0/users/${user.id}`
        });

      log.info('User added to group:', userPrincipalName);
      return { success: true, message: 'User added to group successfully' };

    } catch (error) {
      log.error('Add user to group failed:', error);
      return this.handleError(error);
    }
  }

  async getUserSignInLogs(userPrincipalName, limit = 10) {
    await this.ensureAuthenticated();

    try {
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id')
        .get();

      const logs = await this.graphClient
        .api('/auditLogs/signIns')
        .filter(`userId eq '${user.id}'`)
        .top(limit)
        .orderby('createdDateTime desc')
        .get();

      log.info('Retrieved sign-in logs for:', userPrincipalName);
      return { success: true, data: logs.value };

    } catch (error) {
      log.error('Get sign-in logs failed:', error);
      return this.handleError(error);
    }
  }

  async getAvailableLicenses() {
    await this.ensureAuthenticated();

    try {
      const licenses = await this.graphClient
        .api('/subscribedSkus')
        .get();

      const formatted = licenses.value.map(sku => ({
        skuId: sku.skuId,
        skuPartNumber: sku.skuPartNumber,
        capabilityStatus: sku.capabilityStatus,
        consumedUnits: sku.consumedUnits,
        prepaidUnits: sku.prepaidUnits.enabled,
        available: sku.prepaidUnits.enabled - sku.consumedUnits
      }));

      return { success: true, data: formatted };

    } catch (error) {
      log.error('Get licenses failed:', error);
      return this.handleError(error);
    }
  }

  async listGroups() {
    await this.ensureAuthenticated();

    try {
      const groups = await this.graphClient
        .api('/groups')
        .select('id,displayName,description,groupTypes')
        .top(999)
        .get();

      return { success: true, data: groups.value };

    } catch (error) {
      log.error('List groups failed:', error);
      return this.handleError(error);
    }
  }

  async getUser(userPrincipalName) {
    await this.ensureAuthenticated();

    try {
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .get();

      return { success: true, data: user };

    } catch (error) {
      log.error('Get user failed:', error);
      return this.handleError(error);
    }
  }

  async ensureAuthenticated() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please connect to Microsoft 365 first.');
    }

    // Skip silent refresh for 2 min after device code, and if token was refreshed recently (< 45 min)
    const graceMs = 2 * 60 * 1000;
    const refreshThresholdMs = 45 * 60 * 1000;
    if (this.tokenAcquiredAt && (Date.now() - this.tokenAcquiredAt) < Math.max(graceMs, refreshThresholdMs)) {
      return;
    }

    await this.acquireTokenSilent();
  }

  // ============================================
  // ENHANCED USER MANAGEMENT
  // ============================================

  async enableUser(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .patch({ accountEnabled: true });

      log.info('User enabled:', userPrincipalName);
      return { success: true, message: 'User enabled successfully' };
    } catch (error) {
      log.error('Enable user error:', error);
      return this.handleError(error);
    }
  }

  async setMailboxForwarding(userPrincipalName, forwardToAddress, forwardToName = '') {
    try {
      await this.ensureAuthenticated();

      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id')
        .get();

      const rule = {
        displayName: 'Forward emails (IT Admin)',
        sequence: 1,
        isEnabled: true,
        conditions: {},
        actions: {
          forwardTo: [
            {
              emailAddress: {
                name: forwardToName || forwardToAddress,
                address: forwardToAddress
              }
            }
          ],
          stopProcessingRules: false
        }
      };

      await this.graphClient
        .api(`/users/${user.id}/mailFolders/inbox/messageRules`)
        .post(rule);

      log.info('Mailbox forwarding set for:', userPrincipalName, '->', forwardToAddress);
      return { success: true, message: 'Email forwarding configured' };
    } catch (error) {
      log.error('Set mailbox forwarding error:', error);
      return this.handleError(error);
    }
  }

  async disableUser(userPrincipalName, options = {}) {
    try {
      await this.ensureAuthenticated();

      if (options.forwardEmailsTo) {
        const forwardResult = await this.setMailboxForwarding(
          userPrincipalName,
          options.forwardEmailsTo,
          options.forwardEmailsToName
        );
        if (!forwardResult.success) {
          return { ...forwardResult, message: 'Forwarding failed. User not disabled.' };
        }
      }
      
      await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .patch({ accountEnabled: false });

      if (options.revokeSessions) {
        await this.revokeUserSessions(userPrincipalName);
      }

      if (options.removeLicenses) {
        const user = await this.graphClient.api(`/users/${userPrincipalName}`).get();
        if (user.assignedLicenses && user.assignedLicenses.length > 0) {
          await this.graphClient
            .api(`/users/${userPrincipalName}/assignLicense`)
            .post({
              addLicenses: [],
              removeLicenses: user.assignedLicenses.map(l => l.skuId)
            });
        }
      }

      log.info('User disabled:', userPrincipalName);
      return { success: true, message: 'User disabled successfully' };
    } catch (error) {
      log.error('Disable user error:', error);
      return this.handleError(error);
    }
  }

  async deleteUser(userPrincipalName, permanent = false) {
    try {
      await this.ensureAuthenticated();

      // Get object ID before delete (needed for permanent delete - deletedItems uses ID, not UPN)
      let objectId = null;
      if (permanent) {
        try {
          const user = await this.graphClient
            .api(`/users/${userPrincipalName}`)
            .select('id')
            .get();
          objectId = user.id;
        } catch (e) {
          log.warn('Could not get user ID before delete:', e.message);
        }
      }

      await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .delete();

      if (permanent && objectId) {
        await this.graphClient
          .api(`/directory/deletedItems/${objectId}`)
          .delete();
      }

      log.info('User deleted:', userPrincipalName, 'permanent:', permanent);
      return { success: true, message: permanent ? 'User permanently deleted' : 'User deleted (soft delete)' };
    } catch (error) {
      log.error('Delete user error:', error);
      return this.handleError(error);
    }
  }

  async updateUser(userPrincipalName, userData) {
    try {
      await this.ensureAuthenticated();
      
      await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .patch(userData);

      log.info('User updated:', userPrincipalName);
      return { success: true, message: 'User updated successfully' };
    } catch (error) {
      log.error('Update user error:', error);
      return this.handleError(error);
    }
  }

  async revokeUserSessions(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      await this.graphClient
        .api(`/users/${userPrincipalName}/revokeSignInSessions`)
        .post({});

      log.info('Sessions revoked for:', userPrincipalName);
      return { success: true, message: 'All sign-in sessions revoked' };
    } catch (error) {
      log.error('Revoke sessions error:', error);
      return this.handleError(error);
    }
  }

  async searchUsers(searchTerm, limit = 20) {
    try {
      await this.ensureAuthenticated();
      const term = (searchTerm || '').trim().replace(/'/g, "''");
      if (!term) return { success: true, users: [] };

      const filter = [
        `startswith(displayName,'${term}')`,
        `startswith(userPrincipalName,'${term}')`,
        `startswith(mail,'${term}')`,
        `startswith(givenName,'${term}')`,
        `startswith(surname,'${term}')`
      ].join(' or ');

      const result = await this.graphClient
        .api('/users')
        .filter(filter)
        .select('id,displayName,userPrincipalName,mail,givenName,surname,accountEnabled')
        .top(limit)
        .get();

      // Sort client-side (Graph rejects orderby with this filter)
      const list = result.value || [];
      list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

      return { success: true, users: list };
    } catch (error) {
      const handled = this.handleError(error);
      log.error('Search users failed:', error.message, handled.error?.message);
      if (handled.error?.message === 'An unknown error occurred') {
        log.error('Search users - raw error:', { message: error.message, code: error.code, statusCode: error.statusCode, body: error.body });
      }
      return handled;
    }
  }

  async getUserDetails(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department,mobilePhone,accountEnabled,assignedLicenses,usageLocation,manager')
        .expand('manager($select=displayName,userPrincipalName)')
        .get();

      return { success: true, user };
    } catch (error) {
      log.error('Get user details error:', error);
      return this.handleError(error);
    }
  }

  async getMailboxInfo(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      const userId = encodeURIComponent(userPrincipalName);

      const [userResult, mailboxSettingsResult, licensesResult] = await Promise.all([
        this.graphClient.api(`/users/${userId}`)
          .select('id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,assignedLicenses,signInActivity')
          .get(),
        this.graphClient.api(`/users/${userId}/mailboxSettings`).get().catch(() => null),
        this.getUserLicenses(userPrincipalName)
      ]);

      const user = userResult;
      const mailboxSettings = mailboxSettingsResult || {};
      const autoReply = mailboxSettings.automaticRepliesSetting || {};
      const hasMailbox = (user.assignedLicenses?.length || 0) > 0;
      const licenses = licensesResult.success ? (licensesResult.licenses || []).map(l => l.skuPartNumber) : [];
      const lastSignIn = user.signInActivity?.lastSignInDateTime || null;

      const info = {
        user: {
          displayName: user.displayName,
          userPrincipalName: user.userPrincipalName,
          mail: user.mail || user.userPrincipalName,
          jobTitle: user.jobTitle,
          department: user.department,
          accountEnabled: user.accountEnabled,
          licenseCount: user.assignedLicenses?.length || 0,
          licenses
        },
        lastSignIn,
        forwarding: null,
        mailbox: {
          hasMailbox,
          timeZone: mailboxSettings.timeZone,
          language: mailboxSettings.language?.displayName || mailboxSettings.language?.locale,
          dateFormat: mailboxSettings.dateFormat,
          timeFormat: mailboxSettings.timeFormat
        },
        autoReply: {
          status: autoReply.status || 'disabled',
          internalMessage: autoReply.internalReplyMessage,
          externalMessage: autoReply.externalReplyMessage,
          externalAudience: autoReply.externalAudience,
          scheduledStart: autoReply.scheduledStartDateTime?.dateTime,
          scheduledEnd: autoReply.scheduledEndDateTime?.dateTime
        }
      };

      return { success: true, info };
    } catch (error) {
      log.error('Get mailbox info error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // ENHANCED LICENSE MANAGEMENT
  // ============================================

  async getUserLicenses(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('assignedLicenses')
        .get();

      const licensesRes = await this.getAvailableLicenses();
      const skuList = licensesRes.data || licensesRes.licenses || [];
      const userLicenses = user.assignedLicenses.map(assigned => {
        const licenseInfo = skuList.find(l => l.skuId === assigned.skuId);
        return {
          skuId: assigned.skuId,
          skuPartNumber: licenseInfo?.skuPartNumber || 'Unknown',
          servicePlans: assigned.disabledPlans || []
        };
      });

      return { success: true, licenses: userLicenses };
    } catch (error) {
      log.error('Get user licenses error:', error);
      return this.handleError(error);
    }
  }

  async removeLicenses(userPrincipalName, skuIds) {
    try {
      await this.ensureAuthenticated();
      
      await this.graphClient
        .api(`/users/${userPrincipalName}/assignLicense`)
        .post({
          addLicenses: [],
          removeLicenses: skuIds
        });

      log.info('Licenses removed from:', userPrincipalName);
      return { success: true, message: 'Licenses removed successfully' };
    } catch (error) {
      log.error('Remove licenses error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // ENHANCED GROUP MANAGEMENT
  // ============================================

  async removeUserFromGroup(userPrincipalName, groupId) {
    try {
      await this.ensureAuthenticated();
      
      const user = await this.getUser(userPrincipalName);
      if (!user.success) {
        return user;
      }

      await this.graphClient
        .api(`/groups/${groupId}/members/${user.user.id}/$ref`)
        .delete();

      log.info('User removed from group:', userPrincipalName, groupId);
      return { success: true, message: 'User removed from group successfully' };
    } catch (error) {
      log.error('Remove user from group error:', error);
      return this.handleError(error);
    }
  }

  async getUserGroups(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const groups = await this.graphClient
        .api(`/users/${userPrincipalName}/memberOf`)
        .select('id,displayName,groupTypes,mailEnabled,securityEnabled')
        .get();

      return { success: true, groups: groups.value };
    } catch (error) {
      log.error('Get user groups error:', error);
      return this.handleError(error);
    }
  }

  async listGroupsByType(type = 'all') {
    try {
      await this.ensureAuthenticated();
      
      let filter = '';
      if (type === 'security') {
        filter = 'securityEnabled eq true and mailEnabled eq false';
      } else if (type === 'm365') {
        filter = "groupTypes/any(c:c eq 'Unified')";
      } else if (type === 'distribution') {
        filter = 'mailEnabled eq true and securityEnabled eq false';
      }

      let request = this.graphClient
        .api('/groups')
        .select('id,displayName,groupTypes,mailEnabled,securityEnabled,mail')
        .top(999);

      if (filter) {
        request = request.filter(filter);
      }

      const groups = await request.get();

      return { success: true, groups: groups.value };
    } catch (error) {
      log.error('List groups by type error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // ENHANCED SIGN-IN LOGS
  // ============================================

  async getSignInLogsByDateRange(userPrincipalName, startDate, endDate, filterType = 'all') {
    try {
      await this.ensureAuthenticated();
      
      const user = await this.getUser(userPrincipalName);
      if (!user.success) {
        return user;
      }

      let filter = `userId eq '${user.user.id}'`;
      
      if (startDate) {
        filter += ` and createdDateTime ge ${startDate}`;
      }
      if (endDate) {
        filter += ` and createdDateTime le ${endDate}`;
      }
      
      if (filterType === 'failed') {
        filter += " and status/errorCode ne 0";
      } else if (filterType === 'success') {
        filter += " and status/errorCode eq 0";
      }

      const logs = await this.graphClient
        .api('/auditLogs/signIns')
        .filter(filter)
        .select('createdDateTime,userPrincipalName,appDisplayName,ipAddress,location,status,conditionalAccessStatus')
        .top(100)
        .orderby('createdDateTime desc')
        .get();

      return { success: true, logs: logs.value };
    } catch (error) {
      log.error('Get sign-in logs error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // TENANT INFORMATION
  // ============================================

  async getTenantDomains() {
    try {
      await this.ensureAuthenticated();
      
      const domains = await this.graphClient
        .api('/domains')
        .select('id,isDefault,isInitial,isVerified')
        .get();

      return { success: true, domains: domains.value };
    } catch (error) {
      log.error('Get tenant domains error:', error);
      return this.handleError(error);
    }
  }

  async getTenantInfo() {
    try {
      await this.ensureAuthenticated();
      
      const org = await this.graphClient
        .api('/organization')
        .select('displayName,verifiedDomains,technicalNotificationMails,preferredLanguage')
        .get();

      return { success: true, organization: org.value[0] };
    } catch (error) {
      log.error('Get tenant info error:', error);
      return this.handleError(error);
    }
  }

  async getLicenseReport() {
    try {
      await this.ensureAuthenticated();
      
      const licenses = await this.graphClient
        .api('/subscribedSkus')
        .select('skuId,skuPartNumber,capabilityStatus,consumedUnits,prepaidUnits')
        .get();

      const report = licenses.value.map(sku => ({
        name: sku.skuPartNumber,
        skuId: sku.skuId,
        status: sku.capabilityStatus,
        total: sku.prepaidUnits.enabled,
        assigned: sku.consumedUnits,
        available: sku.prepaidUnits.enabled - sku.consumedUnits
      }));

      return { success: true, licenses: report };
    } catch (error) {
      log.error('Get license report error:', error);
      return this.handleError(error);
    }
  }

  async getUserLicenseReport() {
    try {
      await this.ensureAuthenticated();
      
      const users = await this.graphClient
        .api('/users')
        .select('displayName,userPrincipalName,assignedLicenses,accountEnabled')
        .top(999)
        .get();

      const licensesRes = await this.getAvailableLicenses();
      const skuList = licensesRes.data || [];
      const report = users.value.map(user => {
        const userLicenses = user.assignedLicenses.map(assigned => {
          const licenseInfo = skuList.find(l => l.skuId === assigned.skuId);
          return licenseInfo?.skuPartNumber || assigned.skuId;
        }).join(', ');

        return {
          displayName: user.displayName,
          userPrincipalName: user.userPrincipalName,
          accountEnabled: user.accountEnabled,
          licenses: userLicenses || 'None',
          licenseCount: user.assignedLicenses.length
        };
      });

      return { success: true, users: report };
    } catch (error) {
      log.error('Get user license report error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // MAILBOX INVENTORY
  // ============================================

  async getLicenseSkuMap() {
    await this.ensureAuthenticated();
    const licenses = await this.graphClient
      .api('/subscribedSkus')
      .select('skuId,skuPartNumber')
      .get();
    const map = {};
    (licenses.value || []).forEach(sku => {
      map[sku.skuId] = sku.skuPartNumber || sku.skuId;
    });
    return map;
  }

  async getMailboxInventory(options = {}) {
    try {
      await this.ensureAuthenticated();

      const {
        mailboxType = 'all',
        accountStatus = 'all',
        domain = '',
        includeLicenseDetails = true,
        includeSignInActivity = false
      } = options;

      const selectFields = [
        'displayName',
        'userPrincipalName',
        'mail',
        'accountEnabled',
        'userType',
        'usageLocation',
        'createdDateTime',
        'department',
        'jobTitle',
        'assignedLicenses'
      ];

      if (includeSignInActivity) {
        selectFields.push('signInActivity');
      }

      const skuMap = includeLicenseDetails ? await this.getLicenseSkuMap() : {};
      const allUsers = [];
      let nextLink = null;

      do {
        const request = this.graphClient
          .api(nextLink || '/users')
          .select(selectFields.join(','))
          .top(999);

        const response = nextLink
          ? await this.graphClient.api(nextLink).get()
          : await request.get();

        const users = response.value || [];
        allUsers.push(...users);
        nextLink = response['@odata.nextLink'] || null;
      } while (nextLink);

      let filtered = allUsers;

      if (accountStatus !== 'all') {
        const enabled = accountStatus === 'active';
        filtered = filtered.filter(u => u.accountEnabled === enabled);
      }

      if (mailboxType !== 'all') {
        if (mailboxType === 'user') {
          filtered = filtered.filter(u => u.assignedLicenses?.length > 0);
        } else if (mailboxType === 'shared') {
          filtered = filtered.filter(u => !u.assignedLicenses?.length && (u.mail || u.userPrincipalName));
        } else if (mailboxType === 'disabled') {
          filtered = filtered.filter(u => !u.accountEnabled);
        }
      }

      if (domain) {
        const domainLower = domain.toLowerCase();
        filtered = filtered.filter(u => {
          const upn = (u.userPrincipalName || '').toLowerCase();
          const mail = (u.mail || '').toLowerCase();
          return upn.endsWith('@' + domainLower) || mail.endsWith('@' + domainLower);
        });
      }

      const inventory = filtered.map(user => {
        let licensesStr = 'None';
        if (includeLicenseDetails && user.assignedLicenses?.length) {
          licensesStr = user.assignedLicenses
            .map(a => skuMap[a.skuId] || a.skuId)
            .join('; ');
        }

        const lastSignIn = includeSignInActivity && user.signInActivity?.lastSignInDateTime
          ? user.signInActivity.lastSignInDateTime
          : null;

        return {
          displayName: user.displayName || '',
          userPrincipalName: user.userPrincipalName || '',
          mailboxType: user.assignedLicenses?.length ? 'User' : 'Shared',
          accountEnabled: user.accountEnabled ? 'true' : 'false',
          assignedLicenses: licensesStr,
          usageLocation: user.usageLocation || '',
          lastSignInDate: lastSignIn || '',
          createdDate: user.createdDateTime ? new Date(user.createdDateTime).toISOString().split('T')[0] : '',
          department: user.department || '',
          jobTitle: user.jobTitle || ''
        };
      });

      log.info('Mailbox inventory generated:', inventory.length, 'mailboxes');
      return { success: true, mailboxes: inventory };
    } catch (error) {
      log.error('Get mailbox inventory error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // MAIL FLOW / MESSAGE TRACE (BASIC)
  // ============================================

  async traceMessages(options = {}) {
    await this.ensureAuthenticated();

    try {
      const {
        userPrincipalName,
        subjectContains = '',
        counterpart = '',
        direction = 'all', // sent | received | all
        startDate,
        endDate,
        maxResults = 50
      } = options;

      if (!userPrincipalName) {
        throw new Error('User principal name is required for mail flow trace.');
      }

      // Resolve user ID
      const user = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id,mail,userPrincipalName')
        .get();

      const userId = user.id;
      const selectFields = 'id,subject,from,toRecipients,ccRecipients,sentDateTime,receivedDateTime,isRead,parentFolderId,bodyPreview,hasAttachments,importance,webLink';

      // Build date filter
      const filters = [];
      if (startDate) filters.push(`sentDateTime ge ${startDate}T00:00:00Z`);
      if (endDate) filters.push(`sentDateTime le ${endDate}T23:59:59Z`);
      const filterStr = filters.length ? filters.join(' and ') : null;

      const fetchFromFolder = async (folderName, folderLabel) => {
        const messages = [];
        let url = `/users/${userId}/mailFolders/${folderName}/messages`;
        let request = this.graphClient.api(url).top(50).orderby('sentDateTime DESC').select(selectFields);
        if (filterStr) request = request.filter(filterStr);

        let nextLink = null;
        do {
          const response = nextLink ? await this.graphClient.api(nextLink).get() : await request.get();
          const batch = (response.value || []).map(m => ({ ...m, _folder: folderLabel, _dir: folderName === 'sentitems' ? 'Sent' : 'Received' }));
          messages.push(...batch);
          nextLink = response['@odata.nextLink'] || null;
        } while (nextLink && messages.length < maxResults);
        return messages;
      };

      let allMessages = [];
      if (direction === 'sent') {
        allMessages = await fetchFromFolder('sentitems', 'Sent Items');
      } else if (direction === 'received') {
        allMessages = await fetchFromFolder('inbox', 'Inbox');
      } else {
        const [inbox, sent] = await Promise.all([
          fetchFromFolder('inbox', 'Inbox'),
          fetchFromFolder('sentitems', 'Sent Items')
        ]);
        allMessages = [...inbox, ...sent].sort((a, b) => {
          const da = new Date(a.sentDateTime || 0);
          const db = new Date(b.sentDateTime || 0);
          return db - da;
        });
      }

      const lowerSubject = (subjectContains || '').toLowerCase();
      const lowerCounterpart = (counterpart || '').toLowerCase();

      const filtered = allMessages.filter(msg => {
        if (lowerSubject && !(msg.subject || '').toLowerCase().includes(lowerSubject)) return false;

        const fromAddr = (msg.from?.emailAddress?.address || '').toLowerCase();
        const toAddrs = (msg.toRecipients || []).map(r => (r.emailAddress?.address || '').toLowerCase());
        const ccAddrs = (msg.ccRecipients || []).map(r => (r.emailAddress?.address || '').toLowerCase());

        if (lowerCounterpart) {
          const match = fromAddr.includes(lowerCounterpart) ||
            toAddrs.some(a => a.includes(lowerCounterpart)) ||
            ccAddrs.some(a => a.includes(lowerCounterpart));
          if (!match) return false;
        }
        return true;
      }).slice(0, maxResults);

      const mailboxEmails = [user.mail, user.userPrincipalName].filter(Boolean).map(e => e.toLowerCase());

      const normalized = filtered.map(msg => {
        const fromAddr = msg.from?.emailAddress?.address || '';
        const fromLower = fromAddr.toLowerCase();
        const toAddrs = (msg.toRecipients || []).map(r => r.emailAddress?.address || '').filter(Boolean);
        const toLower = toAddrs.map(a => a.toLowerCase());

        // Direction: prefer folder-based, fallback to from/to comparison
        let dir = msg._dir;
        if (!dir) {
          if (fromLower && mailboxEmails.some(m => m === fromLower)) dir = 'Sent';
          else if (toLower.some(t => mailboxEmails.some(m => m === t))) dir = 'Received';
        }
        dir = dir || 'Unknown';

        // Folder: prefer _folder, infer from direction if missing
        let folder = msg._folder;
        if (!folder) folder = dir === 'Sent' ? 'Sent Items' : dir === 'Received' ? 'Inbox' : 'Unknown';

        const ccAddrs = (msg.ccRecipients || []).map(r => r.emailAddress?.address || '').filter(Boolean);
        const dt = msg.sentDateTime || msg.receivedDateTime || '';
        const dtFormatted = dt ? new Date(dt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '';

        return {
          id: msg.id,
          subject: msg.subject || '(No subject)',
          direction: dir,
          folder: folder,
          status: 'Delivered',
          from: fromAddr,
          to: toAddrs.join('; '),
          cc: ccAddrs.join('; ') || '-',
          sentDateTime: msg.sentDateTime || '',
          receivedDateTime: msg.receivedDateTime || '',
          dateFormatted: dtFormatted,
          isRead: msg.isRead ? 'Yes' : 'No',
          hasAttachments: msg.hasAttachments ? 'Yes' : 'No',
          importance: (msg.importance || 'normal').charAt(0).toUpperCase() + (msg.importance || 'normal').slice(1),
          bodyPreview: (msg.bodyPreview || '').substring(0, 80) + ((msg.bodyPreview || '').length > 80 ? '...' : ''),
          webLink: msg.webLink || ''
        };
      });

      log.info('Mail flow trace messages:', normalized.length);
      return { success: true, messages: normalized };

    } catch (error) {
      log.error('Mail flow trace failed:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // SECURITY OPERATIONS
  // ============================================

  async emergencyLockdown(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const results = {
        passwordReset: false,
        accountDisabled: false,
        sessionsRevoked: false
      };

      const newPassword = this.generateSecurePassword();
      const resetResult = await this.resetUserPassword(userPrincipalName, newPassword);
      results.passwordReset = resetResult.success;

      const disableResult = await this.disableUser(userPrincipalName);
      results.accountDisabled = disableResult.success;

      const revokeResult = await this.revokeUserSessions(userPrincipalName);
      results.sessionsRevoked = revokeResult.success;

      log.info('Emergency lockdown executed for:', userPrincipalName, results);
      
      return { 
        success: true, 
        message: 'Emergency lockdown completed',
        results,
        newPassword
      };
    } catch (error) {
      log.error('Emergency lockdown error:', error);
      return this.handleError(error);
    }
  }

  generateSecurePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // ============================================
  // MANAGER OPERATIONS
  // ============================================

  async setUserManager(userPrincipalName, managerPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const manager = await this.getUser(managerPrincipalName);
      if (!manager.success) {
        return { success: false, error: 'Manager not found' };
      }

      await this.graphClient
        .api(`/users/${userPrincipalName}/manager/$ref`)
        .put({
          '@odata.id': `https://graph.microsoft.com/v1.0/users/${manager.user.id}`
        });

      log.info('Manager set for:', userPrincipalName, 'manager:', managerPrincipalName);
      return { success: true, message: 'Manager assigned successfully' };
    } catch (error) {
      log.error('Set manager error:', error);
      return this.handleError(error);
    }
  }

  async getUserManager(userPrincipalName) {
    try {
      await this.ensureAuthenticated();
      
      const manager = await this.graphClient
        .api(`/users/${userPrincipalName}/manager`)
        .select('displayName,userPrincipalName,mail')
        .get();

      return { success: true, manager };
    } catch (error) {
      if (error.statusCode === 404) {
        return { success: true, manager: null };
      }
      log.error('Get user manager error:', error);
      return this.handleError(error);
    }
  }

  // ============================================
  // SHAREPOINT PROJECTS (ITProjects list)
  // ============================================

  async getSharePointSiteRoot() {
    try {
      await this.ensureAuthenticated();
      const site = await this.graphClient.api('/sites/root').get();
      return { success: true, site: { id: site.id, name: site.displayName } };
    } catch (error) {
      log.error('Get SharePoint site root error:', error);
      return this.handleError(error);
    }
  }

  async getProjectsListId(siteId) {
    try {
      await this.ensureAuthenticated();
      const res = await this.graphClient
        .api(`/sites/${siteId}/lists`)
        .filter("displayName eq 'ITProjects'")
        .select('id,displayName')
        .get();
      const list = res.value && res.value[0];
      if (list) {
        return { success: true, listId: list.id };
      }
      const created = await this.createITProjectsList(siteId);
      if (created.success) {
        return { success: true, listId: created.listId };
      }
      return { success: false, error: created.error || { code: 'LIST_NOT_FOUND', message: 'SharePoint list "ITProjects" not found. Create it in your SharePoint site first.' } };
    } catch (error) {
      log.error('Get projects list id error:', error);
      return this.handleError(error);
    }
  }

  async createITProjectsList(siteId) {
    try {
      await this.ensureAuthenticated();
      const body = {
        displayName: 'ITProjects',
        columns: [
          { name: 'ProjectName', text: {} },
          { name: 'Owner', text: {} },
          { name: 'AssignedTo', text: {} },
          { name: 'Status', choice: { choices: ['Planned', 'In Progress', 'Blocked', 'Completed'], displayAs: 'dropDownMenu' } },
          { name: 'Priority', choice: { choices: ['Low', 'Medium', 'High', 'Critical'], displayAs: 'dropDownMenu' } },
          { name: 'StartDate', dateTime: { format: 'dateOnly' } },
          { name: 'DueDate', dateTime: { format: 'dateOnly' } },
          { name: 'Progress', number: {} },
          { name: 'Description', text: {} },
          { name: 'Tasks', text: {} },
          { name: 'Notes', text: {} },
          { name: 'ActivityLog', text: {} },
          { name: 'CreatedDate', dateTime: { format: 'dateTime' } },
          { name: 'LastUpdated', dateTime: { format: 'dateTime' } }
        ],
        list: { template: 'genericList' }
      };
      const created = await this.graphClient
        .api(`/sites/${siteId}/lists`)
        .post(body);
      log.info('Created ITProjects list:', created.id);
      return { success: true, listId: created.id };
    } catch (error) {
      log.error('Create ITProjects list error:', error);
      const handled = this.handleError(error);
      if (error.statusCode === 403) {
        return {
          success: false,
          error: {
            code: 'LIST_CREATE_DENIED',
            message: 'Cannot create the ITProjects list: permission denied. Either grant Sites.Manage.All (admin consent) in Azure for this app, or create the list manually: in SharePoint go to Site contents → New → List → Blank, name it exactly "ITProjects", then add columns (ProjectName, Owner, AssignedTo, Status, Priority, StartDate, DueDate, Progress, Description, Tasks, Notes, ActivityLog, CreatedDate, LastUpdated). See docs/SharePoint-ITProjects-List-Schema.md for details.'
          },
          listId: null
        };
      }
      return { success: false, error: handled.error, listId: null };
    }
  }

  _listIdCache(siteId, listId) {
    if (!this._projectListCache) this._projectListCache = { siteId: null, listId: null };
    if (this._projectListCache.siteId === siteId) return this._projectListCache.listId;
    this._projectListCache = { siteId, listId };
    return listId;
  }

  async getProjects(options = {}) {
    const { siteId: optSiteId, listId: optListId, top = 200, skipToken } = options;
    try {
      await this.ensureAuthenticated();
      let siteId = optSiteId;
      let listId = optListId;
      if (!siteId) {
        const siteRes = await this.getSharePointSiteRoot();
        if (!siteRes.success) return siteRes;
        siteId = siteRes.site.id;
      }
      if (!listId) {
        const listRes = await this.getProjectsListId(siteId);
        if (!listRes.success) return listRes;
        listId = listRes.listId;
        this._listIdCache(siteId, listId);
      }
      let url = `/sites/${siteId}/lists/${listId}/items?expand=fields&$top=${Math.min(top, 999)}`;
      if (skipToken) url += `&$skiptoken=${encodeURIComponent(skipToken)}`;
      const res = await this.graphClient.api(url).get();
      const items = (res.value || []).map((item) => {
        const f = item.fields || {};
        const parseTasks = (raw) => {
          if (!raw) return { tasks: [] };
          try {
            const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(o.tasks) ? o : { tasks: [] };
          } catch (_) {
            return { tasks: [] };
          }
        };
        const parseNotes = (raw) => {
          if (!raw) return [];
          try {
            const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(a) ? a : [];
          } catch (_) {
            return [];
          }
        };
        const parseActivity = (raw) => {
          if (!raw) return [];
          try {
            const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(a) ? a : [];
          } catch (_) {
            return [];
          }
        };
        const parseOwner = (raw) => {
          if (!raw) return null;
          if (typeof raw === 'object') return { displayName: raw.displayName, userPrincipalName: raw.userPrincipalName || raw.email };
          const s = String(raw);
          const m = s.match(/^(.+)\s*\(([^)]+)\)$/);
          return m ? { displayName: m[1].trim(), userPrincipalName: m[2].trim() } : { displayName: s };
        };
        const parseAssignedTo = (raw) => {
          if (!raw) return [];
          if (Array.isArray(raw)) return raw.map(u => typeof u === 'object' ? { displayName: u.displayName, userPrincipalName: u.userPrincipalName || u.email } : { displayName: String(u) });
          try {
            const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(a) ? a.map(u => typeof u === 'object' ? { displayName: u.displayName, userPrincipalName: u.userPrincipalName || u.email } : { displayName: String(u) }) : [];
          } catch (_) {
            return [];
          }
        };
        return {
          id: item.id,
          projectName: f.ProjectName || f.Title || '',
          owner: parseOwner(f.Owner),
          assignedTo: parseAssignedTo(f.AssignedTo),
          status: f.Status || 'Planned',
          priority: f.Priority || 'Medium',
          startDate: f.StartDate || null,
          dueDate: f.DueDate || null,
          progress: typeof f.Progress === 'number' ? f.Progress : (parseInt(f.Progress, 10) || 0),
          description: f.Description || '',
          tasks: parseTasks(f.Tasks),
          notes: parseNotes(f.Notes),
          activity: parseActivity(f.ActivityLog || f.Activity),
          createdBy: f.CreatedBy ? (typeof f.CreatedBy === 'object' ? { displayName: f.CreatedBy.displayName } : { displayName: String(f.CreatedBy) }) : null,
          createdDate: f.CreatedDate || f.Created || null,
          lastUpdated: f.LastUpdated || f.Modified || null
        };
      });
      return { success: true, items, nextSkipToken: res['@odata.nextLink'] ? (res['@odata.nextLink'].match(/\$skiptoken=([^&]+)/) || [])[1] : null };
    } catch (error) {
      log.error('Get projects error:', error);
      return this.handleError(error);
    }
  }

  async getProject(siteId, listId, itemId) {
    try {
      await this.ensureAuthenticated();
      if (!siteId || !listId) {
        const siteRes = await this.getSharePointSiteRoot();
        if (!siteRes.success) return siteRes;
        siteId = siteId || siteRes.site.id;
        const listRes = await this.getProjectsListId(siteId);
        if (!listRes.success) return listRes;
        listId = listId || listRes.listId;
      }
      const item = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items/${itemId}`)
        .expand('fields')
        .get();
      const f = item.fields || {};
      const parseTasks = (raw) => {
        if (!raw) return { tasks: [] };
        try {
          const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(o.tasks) ? o : { tasks: [] };
        } catch (_) {
          return { tasks: [] };
        }
      };
      const parseNotes = (raw) => {
        if (!raw) return [];
        try {
          const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(a) ? a : [];
        } catch (_) {
          return [];
        }
      };
      const parseActivity = (raw) => {
        if (!raw) return [];
        try {
          const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(a) ? a : [];
        } catch (_) {
          return [];
        }
      };
      const parseOwner = (raw) => {
        if (!raw) return null;
        if (typeof raw === 'object') return { displayName: raw.displayName, userPrincipalName: raw.userPrincipalName || raw.email };
        const s = String(raw);
        const m = s.match(/^(.+)\s*\(([^)]+)\)$/);
        return m ? { displayName: m[1].trim(), userPrincipalName: m[2].trim() } : { displayName: s };
      };
      const parseAssignedTo = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.map(u => typeof u === 'object' ? { displayName: u.displayName, userPrincipalName: u.userPrincipalName || u.email } : { displayName: String(u) });
        try {
          const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(a) ? a.map(u => typeof u === 'object' ? { displayName: u.displayName, userPrincipalName: u.userPrincipalName || u.email } : { displayName: String(u) }) : [];
        } catch (_) {
          return [];
        }
      };
      return {
        success: true,
        item: {
          id: item.id,
          projectName: f.ProjectName || f.Title || '',
          owner: parseOwner(f.Owner),
          assignedTo: parseAssignedTo(f.AssignedTo),
          status: f.Status || 'Planned',
          priority: f.Priority || 'Medium',
          startDate: f.StartDate || null,
          dueDate: f.DueDate || null,
          progress: typeof f.Progress === 'number' ? f.Progress : (parseInt(f.Progress, 10) || 0),
          description: f.Description || '',
          tasks: parseTasks(f.Tasks),
          notes: parseNotes(f.Notes),
          activity: parseActivity(f.ActivityLog || f.Activity),
          createdBy: f.CreatedBy ? (typeof f.CreatedBy === 'object' ? { displayName: f.CreatedBy.displayName } : { displayName: String(f.CreatedBy) }) : null,
          createdDate: f.CreatedDate || f.Created || null,
          lastUpdated: f.LastUpdated || f.Modified || null
        }
      };
    } catch (error) {
      log.error('Get project error:', error);
      return this.handleError(error);
    }
  }

  _personToFields(owner, assignedTo) {
    const toLookup = (u) => {
      if (!u) return null;
      if (typeof u === 'object' && (u.id || u.lookupId)) return { LookupId: u.lookupId || u.id };
      if (typeof u === 'object' && (u.userPrincipalName || u.email)) {
        return {
          '@odata.type': '#sharepoint.user',
          displayName: u.displayName || u.userPrincipalName || u.email,
          userPrincipalName: u.userPrincipalName || u.email
        };
      }
      return typeof u === 'string' ? u : null;
    };
    const fields = {};
    if (owner != null) fields.Owner = toLookup(owner);
    if (assignedTo != null) {
      const arr = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      fields.AssignedTo = arr.map(toLookup).filter(Boolean);
    }
    return fields;
  }

  _personToTextValues(owner, assignedTo) {
    const fields = {};
    if (owner != null) {
      fields.Owner = typeof owner === 'object'
        ? `${owner.displayName || ''} (${owner.userPrincipalName || owner.email || ''})`.trim() || ''
        : String(owner || '');
    }
    if (assignedTo != null) {
      const arr = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
      fields.AssignedTo = JSON.stringify(arr.map((u) => (typeof u === 'object'
        ? { displayName: u.displayName, userPrincipalName: u.userPrincipalName || u.email }
        : { displayName: String(u), userPrincipalName: '' })));
    }
    return fields;
  }

  async createProject(project, options = {}) {
    const { siteId: optSiteId, listId: optListId } = options;
    try {
      await this.ensureAuthenticated();
      let siteId = optSiteId;
      let listId = optListId;
      if (!siteId) {
        const siteRes = await this.getSharePointSiteRoot();
        if (!siteRes.success) return siteRes;
        siteId = siteRes.site.id;
      }
      if (!listId) {
        const listRes = await this.getProjectsListId(siteId);
        if (!listRes.success) return listRes;
        listId = listRes.listId;
      }
      const now = new Date().toISOString();
      const tasksJson = project.tasks && typeof project.tasks === 'object' ? JSON.stringify(project.tasks) : (project.tasksJson || '{"tasks":[]}');
      const notesJson = project.notes && Array.isArray(project.notes) ? JSON.stringify(project.notes) : '[]';
      const activityJson = JSON.stringify([{ action: 'Project created', by: project.createdByDisplay || 'System', at: now }]);
      const personFields = this._personToTextValues(project.owner, project.assignedTo);
      const fields = {
        Title: project.projectName || 'Untitled Project',
        ProjectName: project.projectName || 'Untitled Project',
        Status: project.status || 'Planned',
        Priority: project.priority || 'Medium',
        StartDate: project.startDate || null,
        DueDate: project.dueDate || null,
        Progress: project.progress != null ? project.progress : 0,
        Description: project.description || '',
        Tasks: tasksJson,
        Notes: notesJson,
        ActivityLog: activityJson,
        CreatedDate: now,
        LastUpdated: now,
        ...personFields
      };
      const created = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .post({ fields });
      const id = created.id;
      const getRes = await this.getProject(siteId, listId, id);
      return getRes.success ? { success: true, item: getRes.item } : { success: true, item: { id, ...project } };
    } catch (error) {
      log.error('Create project error:', error);
      return this.handleError(error);
    }
  }

  async updateProject(siteId, listId, itemId, updates, options = {}) {
    try {
      await this.ensureAuthenticated();
      if (!siteId || !listId) {
        const siteRes = await this.getSharePointSiteRoot();
        if (!siteRes.success) return siteRes;
        siteId = siteId || siteRes.site.id;
        const listRes = await this.getProjectsListId(siteId);
        if (!listRes.success) return listRes;
        listId = listId || listRes.listId;
      }
      const fields = { LastUpdated: new Date().toISOString() };
      if (updates.projectName !== undefined) fields.ProjectName = updates.projectName;
      if (updates.title !== undefined) fields.Title = updates.projectName || updates.title;
      if (updates.status !== undefined) fields.Status = updates.status;
      if (updates.priority !== undefined) fields.Priority = updates.priority;
      if (updates.startDate !== undefined) fields.StartDate = updates.startDate;
      if (updates.dueDate !== undefined) fields.DueDate = updates.dueDate;
      if (updates.progress !== undefined) fields.Progress = updates.progress;
      if (updates.description !== undefined) fields.Description = updates.description;
      if (updates.tasks !== undefined) fields.Tasks = typeof updates.tasks === 'string' ? updates.tasks : JSON.stringify(updates.tasks);
      if (updates.notes !== undefined) fields.Notes = typeof updates.notes === 'string' ? updates.notes : JSON.stringify(updates.notes);
      if (updates.activity !== undefined) fields.ActivityLog = typeof updates.activity === 'string' ? updates.activity : JSON.stringify(updates.activity);
      if (updates.owner !== undefined) Object.assign(fields, this._personToTextValues(updates.owner, null));
      if (updates.assignedTo !== undefined) Object.assign(fields, this._personToTextValues(null, updates.assignedTo));
      await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items/${itemId}/fields`)
        .patch(fields);
      const getRes = await this.getProject(siteId, listId, itemId);
      return getRes.success ? { success: true, item: getRes.item } : { success: true };
    } catch (error) {
      log.error('Update project error:', error);
      return this.handleError(error);
    }
  }

  async deleteProject(siteId, listId, itemId) {
    try {
      await this.ensureAuthenticated();
      if (!siteId || !listId) {
        const siteRes = await this.getSharePointSiteRoot();
        if (!siteRes.success) return siteRes;
        siteId = siteId || siteRes.site.id;
        const listRes = await this.getProjectsListId(siteId);
        if (!listRes.success) return listRes;
        listId = listRes.listId;
      }
      await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items/${itemId}`)
        .delete();
      return { success: true };
    } catch (error) {
      log.error('Delete project error:', error);
      return this.handleError(error);
    }
  }

  handleError(error) {
    let message = 'An unknown error occurred';
    let code = 'UNKNOWN_ERROR';

    const errMsg = (error.message || '').toString();
    const cause = error.cause ? (String(error.cause?.message || error.cause?.code || error.cause)) : '';

    // Try to extract Graph API error from body first
    if (error.body) {
      try {
        const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        const graphErr = body?.error;
        if (graphErr?.message) {
          message = graphErr.message;
          code = graphErr.code || `HTTP_${error.statusCode || 0}`;
        }
      } catch (e) { /* ignore parse error */ }
    }

    if (message === 'An unknown error occurred' || !message) {
      if (errMsg.includes('fetch failed') || /fetch|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(errMsg + cause)) {
        message = 'Network error: Could not reach Microsoft Graph. Check internet, firewall, and proxy. Ensure https://graph.microsoft.com is not blocked.';
        if (cause) message += ` (${cause})`;
        code = 'NETWORK_ERROR';
      } else if (errMsg.includes('AADSTS65001') || errMsg.includes('consent')) {
        message = 'Admin consent required. Ask your tenant admin to grant consent in Azure Portal, or disconnect and reconnect.';
        code = 'AADSTS65001';
      } else if (error.statusCode) {
        code = `HTTP_${error.statusCode}`;
        if (error.statusCode === 401) message = 'Authentication failed. Please disconnect and reconnect.';
        else if (error.statusCode === 403) {
          message = 'SharePoint access denied. The app needs delegated permissions (Sites.ReadWrite.All and, to auto-create the list, Sites.Manage.All). '
            + 'Ask your tenant admin to add these in Azure Portal (App registration → API permissions) and grant admin consent. '
            + 'Your account must also have access to the SharePoint site. Alternatively, create the "ITProjects" list manually on your SharePoint site.';
          code = 'ACCESS_DENIED';
        } else if (error.statusCode === 404) message = 'Resource not found.';
        else if (message === 'An unknown error occurred') message = errMsg || `HTTP ${error.statusCode}`;
      } else if (errMsg) {
        message = errMsg;
      } else if (cause) {
        message = cause;
      }
    }

    return {
      success: false,
      error: {
        code: code,
        message: message,
        details: error.message
      }
    };
  }
}

module.exports = M365Client;
