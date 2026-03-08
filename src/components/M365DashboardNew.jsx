import React, { useState, useEffect } from 'react';
import { 
  Cloud, User, Award, Users, FileText, Shield, Building2, 
  Loader2, CheckCircle, AlertCircle, UserPlus, Key, UserX, 
  Trash2, UserCheck, XCircle, Mail
} from 'lucide-react';
import { useToast } from './m365/useToast';
import { ToastContainer } from './m365/Toast';
import ActivityLog from './m365/ActivityLog';
import CreateUser from './m365/CreateUser';
import ResetPassword from './m365/ResetPassword';
import EnableDisableUser from './m365/EnableDisableUser';
import DeleteUser from './m365/DeleteUser';
import AssignLicense from './m365/AssignLicense';
import RemoveLicense from './m365/RemoveLicense';
import ViewLicenses from './m365/ViewLicenses';
import ManageGroups from './m365/ManageGroups';
import SignInLogs from './m365/SignInLogs';
import EmergencyLockdown from './m365/EmergencyLockdown';
import TenantInfo from './m365/TenantInfo';
import MailboxInventory from './m365/MailboxInventory';
import MailFlow from './m365/MailFlow';
import GrantMailboxPermissions from './m365/GrantMailboxPermissions';

const M365DashboardNew = () => {
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [loading, setLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState(null);
  const [activeSection, setActiveSection] = useState('user-management');
  const [activeAction, setActiveAction] = useState('create-user');
  const [activities, setActivities] = useState([]);
  const { toasts, removeToast, success, error: showError } = useToast();

  const clientId = 'b3f2e8af-f78d-4068-81ac-36ab964d2de7';
  const tenantId = 'd81fbb07-701f-4aa5-aa96-c605b8c236c9';

  useEffect(() => {
    checkAuthStatus();
    
    if (window.electron?.m365?.onDeviceCode) {
      window.electron.m365.onDeviceCode((deviceCodeInfo) => {
        setDeviceCode(deviceCodeInfo);
      });
    }
  }, []);

  const checkAuthStatus = async () => {
    if (window.electron?.m365) {
      const status = await window.electron.m365.getAuthStatus();
      setAuthStatus(status);
    }
  };

  const getErrorMessage = (result) => {
    const err = result?.error;
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    const parts = [err.message];
    if (err.code) parts.unshift(`[${err.code}]`);
    if (err.details) parts.push(err.details);
    return parts.filter(Boolean).join(' ');
  };

  const addActivity = (action, details, isSuccess, errorMessage) => {
    const activity = {
      action,
      details,
      success: isSuccess,
      error: errorMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    setActivities(prev => [activity, ...prev.slice(0, 9)]);
  };

  const handleConnect = async () => {
    setLoading(true);
    setDeviceCode(null);

    try {
      if (!window.electron?.m365) {
        throw new Error('M365 API not available. Please restart the app.');
      }

      await window.electron.m365.initialize(clientId, tenantId);
      const authResult = await window.electron.m365.authenticate();
      
      if (authResult.success) {
        setAuthStatus({ authenticated: true, username: authResult.username });
        success('Connected to Microsoft 365!');
        setDeviceCode(null);
      } else {
        showError(authResult.error);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await window.electron.m365.disconnect();
    setAuthStatus({ authenticated: false });
    setActiveSection('user-management');
    setActiveAction('create-user');
    success('Disconnected from Microsoft 365');
  };

  const handleCreateUser = async (userData, managerPrincipalName) => {
    setLoading(true);
    try {
      const password = userData.passwordProfile?.password ?? userData.password;
      const result = await window.electron.m365.createUser(userData, password);
      
      if (result.success) {
        success(`User created: ${userData.displayName}`);
        addActivity('Create User', userData.userPrincipalName, true);
        
        if (managerPrincipalName) {
          await window.electron.m365.setUserManager(userData.userPrincipalName, managerPrincipalName);
        }
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Create User Failed', userData.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.resetPassword(
        data.userPrincipalName,
        data.newPassword
      );
      
      if (result.success) {
        success(`Password reset for ${data.userPrincipalName}`);
        addActivity('Reset Password', data.userPrincipalName, true);
        
        if (data.revokeSessions) {
          await window.electron.m365.revokeUserSessions(data.userPrincipalName);
        }
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Reset Password Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleEnableDisable = async (data) => {
    setLoading(true);
    try {
      const result = data.action === 'enable'
        ? await window.electron.m365.enableUser(data.userPrincipalName)
        : await window.electron.m365.disableUser(data.userPrincipalName, {
            removeLicenses: data.removeLicenses,
            revokeSessions: data.revokeSessions,
            forwardEmailsTo: data.forwardEmailsTo || undefined,
            forwardEmailsToName: data.forwardEmailsToName || undefined
          });
      
      if (result.success) {
        success(`User ${data.action}d successfully`);
        addActivity(`${data.action === 'enable' ? 'Enable' : 'Disable'} User`, data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity(`${data.action === 'enable' ? 'Enable' : 'Disable'} User Failed`, data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (data) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.deleteUser(
        data.userPrincipalName,
        data.permanent
      );
      
      if (result.success) {
        success(result.message);
        addActivity(`Delete User (${data.permanent ? 'Permanent' : 'Soft'})`, data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Delete User Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLicense = async (data) => {
    setLoading(true);
    try {
      if (data.removeExisting) {
        const userLicenses = await window.electron.m365.getUserLicenses(data.userPrincipalName);
        if (userLicenses.success && userLicenses.licenses.length > 0) {
          const skuIds = userLicenses.licenses.map(l => l.skuId);
          await window.electron.m365.removeLicenses(data.userPrincipalName, skuIds);
        }
      }

      const result = await window.electron.m365.assignLicense(
        data.userPrincipalName,
        data.skuId
      );
      
      if (result.success) {
        success('License assigned successfully');
        addActivity('Assign License', data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Assign License Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLicenses = async (data) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.removeLicenses(
        data.userPrincipalName,
        data.selectedLicenses
      );
      
      if (result.success) {
        success('Licenses removed successfully');
        addActivity('Remove Licenses', data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Remove Licenses Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleManageGroup = async (data) => {
    setLoading(true);
    try {
      const result = data.action === 'add'
        ? await window.electron.m365.addUserToGroup(data.userPrincipalName, data.groupId)
        : await window.electron.m365.removeUserFromGroup(data.userPrincipalName, data.groupId);
      
      if (result.success) {
        success(`User ${data.action === 'add' ? 'added to' : 'removed from'} group`);
        addActivity(`${data.action === 'add' ? 'Add to' : 'Remove from'} Group`, data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Group Operation Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleGetSignInLogs = async (data) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.getSignInLogsByDateRange(
        data.userPrincipalName,
        data.startDate,
        data.endDate,
        data.filterType
      );
      
      if (result.success) {
        success(`Retrieved ${result.logs.length} sign-in logs`);
        addActivity('Get Sign-in Logs', data.userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Get Sign-in Logs Failed', data.userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyLockdown = async (userPrincipalName) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.emergencyLockdown(userPrincipalName);
      
      if (result.success) {
        success('Emergency lockdown executed');
        addActivity('Emergency Lockdown', userPrincipalName, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Emergency Lockdown Failed', userPrincipalName, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleGetMailboxInventory = async (options) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.getMailboxInventory(options);
      
      if (result.success) {
        success(`Generated report: ${result.mailboxes?.length || 0} mailboxes`);
        addActivity('Mailbox Inventory', `${result.mailboxes?.length || 0} mailboxes`, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Mailbox Inventory Failed', result.error?.message, false, errMsg);
      }
      
      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleMailFlowTrace = async (options) => {
    setLoading(true);
    try {
      const result = await window.electron.m365.traceMessages(options);

      if (result.success) {
        const count = result.messages?.length || 0;
        success(`Mail flow trace returned ${count} messages`);
        addActivity('Mail Flow Trace', `${count} messages`, true);
      } else {
        const errMsg = getErrorMessage(result);
        showError(errMsg);
        addActivity('Mail Flow Trace Failed', result.error?.message, false, errMsg);
      }

      return result;
    } catch (err) {
      showError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 'user-management',
      name: 'User Management',
      icon: User,
      actions: [
        { id: 'create-user', name: 'Create User', icon: UserPlus },
        { id: 'reset-password', name: 'Reset Password', icon: Key },
        { id: 'enable-disable', name: 'Enable / Disable', icon: UserCheck },
        { id: 'delete-user', name: 'Delete User', icon: Trash2 }
      ]
    },
    {
      id: 'licenses',
      name: 'Licenses',
      icon: Award,
      actions: [
        { id: 'assign-license', name: 'Assign License', icon: Award },
        { id: 'remove-license', name: 'Remove License', icon: XCircle },
        { id: 'view-licenses', name: 'View All Licenses', icon: FileText }
      ]
    },
    {
      id: 'groups',
      name: 'Groups',
      icon: Users,
      actions: [
        { id: 'manage-groups', name: 'Add / Remove User', icon: Users }
      ]
    },
    {
      id: 'mailbox-inventory',
      name: 'Mailbox Inventory',
      icon: Mail,
      actions: [
        { id: 'mailbox-inventory', name: 'Export to CSV', icon: Mail }
      ]
    },
    {
      id: 'mailflow',
      name: 'Mail Flow',
      icon: Mail,
      actions: [
        { id: 'mailflow', name: 'Trace Email', icon: Mail }
      ]
    },
    {
      id: 'mailbox-permissions',
      name: 'Mailbox Permissions',
      icon: Key,
      actions: [
        { id: 'grant-mailbox-permissions', name: 'Grant Permissions', icon: Key }
      ]
    },
    {
      id: 'signin-logs',
      name: 'Sign-in Logs',
      icon: FileText,
      actions: [
        { id: 'signin-logs', name: 'View Logs', icon: FileText }
      ]
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      actions: [
        { id: 'emergency-lockdown', name: 'Emergency Lockdown', icon: Shield }
      ]
    },
    {
      id: 'tenant-info',
      name: 'Tenant Info',
      icon: Building2,
      actions: [
        { id: 'tenant-info', name: 'Organization Info', icon: Building2 }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeAction) {
      case 'create-user':
        return <CreateUser onSubmit={handleCreateUser} loading={loading} />;
      case 'reset-password':
        return <ResetPassword onSubmit={handleResetPassword} loading={loading} />;
      case 'enable-disable':
        return <EnableDisableUser onSubmit={handleEnableDisable} loading={loading} />;
      case 'delete-user':
        return <DeleteUser onSubmit={handleDeleteUser} loading={loading} />;
      case 'assign-license':
        return <AssignLicense onSubmit={handleAssignLicense} loading={loading} />;
      case 'remove-license':
        return <RemoveLicense onSubmit={handleRemoveLicenses} loading={loading} />;
      case 'view-licenses':
        return <ViewLicenses />;
      case 'manage-groups':
        return <ManageGroups onSubmit={handleManageGroup} loading={loading} />;
      case 'signin-logs':
        return <SignInLogs onSubmit={handleGetSignInLogs} loading={loading} />;
      case 'emergency-lockdown':
        return <EmergencyLockdown onSubmit={handleEmergencyLockdown} loading={loading} />;
      case 'tenant-info':
        return <TenantInfo />;
      case 'mailbox-inventory':
        return (
          <MailboxInventory
            onSubmit={handleGetMailboxInventory}
            loading={loading}
            onExportSuccess={() => success('Mailbox inventory exported to CSV')}
          />
        );
      case 'mailflow':
        return <MailFlow onSubmit={handleMailFlowTrace} loading={loading} />;
      case 'grant-mailbox-permissions':
        return (
          <GrantMailboxPermissions
            onCopySuccess={() => success('Script copied to clipboard')}
            onRunSuccess={() => success('PowerShell window launched')}
            onRunError={(msg) => showError(msg)}
          />
        );
      default:
        return <div className="text-slate-400">Select an action from the sidebar</div>;
    }
  };

  if (!authStatus.authenticated) {
    return (
      <>
        <ConnectionPanel
          loading={loading}
          deviceCode={deviceCode}
          onConnect={handleConnect}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <div className="flex-1 min-w-0 h-full flex bg-slate-900 overflow-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Connection Status */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Connected</span>
          </div>
          <p className="text-xs text-slate-400 truncate">{authStatus.username}</p>
          <button
            onClick={handleDisconnect}
            className="mt-2 w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
          >
            Disconnect
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <div key={section.id} className="mb-2">
                <button
                  onClick={() => {
                    setActiveSection(section.id);
                    setActiveAction(section.actions[0].id);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <SectionIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
                
                {isActive && section.actions.length > 1 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.actions.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => setActiveAction(action.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                            activeAction === action.id
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <ActionIcon className="w-3 h-3" />
                          {action.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Microsoft 365 Admin Console</h1>
              <p className="text-blue-100 text-sm">Enterprise IT Administration</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="grid grid-cols-3 gap-6 p-6 w-full">
            <div className="col-span-2">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                {renderContent()}
              </div>
            </div>
            <div className="col-span-1">
              <ActivityLog activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConnectionPanel = ({ loading, deviceCode, onConnect }) => {
  return (
    <div className="h-full flex items-center justify-center bg-slate-900 p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Cloud className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect to Microsoft 365</h2>
            <p className="text-slate-400">Secure authentication with Device Code Flow</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-blue-300 mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Click "Connect" below</li>
                  <li>You'll receive a unique code</li>
                  <li>Visit microsoft.com/devicelogin</li>
                  <li>Enter the code and sign in with your Microsoft 365 account</li>
                  <li>Return here - you'll be connected!</li>
                </ol>
              </div>
            </div>
          </div>

          {deviceCode && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300 flex-1">
                  <p className="font-semibold text-blue-300 mb-2">Device Code Authentication</p>
                  <p className="text-slate-400 mb-3">
                    Go to:{' '}
                    <a
                      href={deviceCode.verificationUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {deviceCode.verificationUri}
                    </a>
                  </p>
                  <div>
                    <label className="block text-slate-400 text-xs mb-1">Enter this code:</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-slate-900 rounded-lg text-green-400 font-mono text-2xl font-bold text-center tracking-wider">
                        {deviceCode.userCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(deviceCode.userCode)}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">Waiting for authentication...</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onConnect}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="w-5 h-5" />
                Connect to Microsoft 365
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Pre-configured for your organization</p>
            <p className="text-xs text-slate-500">Azure App ID: b3f2e8af-f78d-4068-81ac-36ab964d2de7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default M365DashboardNew;
