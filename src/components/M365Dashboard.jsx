import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, User, Key, Users, FileText, Shield, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const M365Dashboard = () => {
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [loading, setLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState(null);
  const [activeTab, setActiveTab] = useState('connect');
  // Azure App Registration Client ID (public identifier - safe to hardcode)
  const [clientId] = useState('b3f2e8af-f78d-4068-81ac-36ab964d2de7');
  // Tenant ID for single-tenant app (shaharnet organization)
  const [tenantId] = useState('d81fbb07-701f-4aa5-aa96-c605b8c236c9');
  const [result, setResult] = useState(null);

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

  const handleConnect = async () => {
    console.log('M365: Starting connection...');
    setLoading(true);
    setResult(null);
    setDeviceCode(null);

    try {
      console.log('M365: Checking if window.electron.m365 exists:', !!window.electron?.m365);
      
      if (!window.electron?.m365) {
        throw new Error('M365 API not available. Please restart the app.');
      }

      console.log('M365: Initializing with clientId:', clientId);
      const initResult = await window.electron.m365.initialize(clientId, tenantId);
      console.log('M365: Initialize result:', initResult);
      
      if (!initResult.success) {
        setResult({ success: false, error: initResult.error });
        setLoading(false);
        return;
      }

      console.log('M365: Starting authentication...');
      const authResult = await window.electron.m365.authenticate();
      console.log('M365: Auth result:', authResult);
      
      if (authResult.success) {
        setAuthStatus({ authenticated: true, username: authResult.username });
        setResult({ success: true, message: 'Connected successfully!' });
        setDeviceCode(null);
      } else {
        setResult({ success: false, error: authResult.error });
      }
    } catch (error) {
      console.error('M365: Connection error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await window.electron.m365.disconnect();
    setAuthStatus({ authenticated: false });
    setResult(null);
    setActiveTab('connect');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Microsoft 365 Integration</h1>
              <p className="text-blue-100 text-sm">Manage users, licenses, and groups via Microsoft Graph API</p>
            </div>
          </div>
          
          {authStatus.authenticated && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Connected</span>
                </div>
                <div className="text-blue-100 text-sm">{authStatus.username}</div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {!authStatus.authenticated ? (
          <ConnectionPanel
            loading={loading}
            deviceCode={deviceCode}
            result={result}
            onConnect={handleConnect}
          />
        ) : (
          <ActionsPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            result={result}
            setResult={setResult}
          />
        )}
      </div>
    </div>
  );
};

const ConnectionPanel = ({ loading, deviceCode, result, onConnect }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
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
              <div className="flex-1">
                <p className="text-blue-300 font-semibold mb-2">Device Code Authentication</p>
                <p className="text-slate-300 text-sm mb-3">
                  Go to: <a href="https://microsoft.com/devicelogin" target="_blank" className="text-blue-400 underline">microsoft.com/devicelogin</a>
                </p>
                <div className="bg-slate-900 rounded px-4 py-3 mb-2">
                  <p className="text-xs text-slate-400 mb-1">Enter this code:</p>
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">{deviceCode.userCode}</p>
                </div>
                <p className="text-xs text-slate-400">Waiting for authentication...</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-4 mb-6 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                  {result.success ? 'Success' : 'Error'}
                </p>
                <p className="text-slate-300 text-sm">{result.message || result.error}</p>
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
  );
};

const ActionsPanel = ({ activeTab, setActiveTab, result, setResult }) => {
  const tabs = [
    { id: 'users', label: 'User Management', icon: User },
    { id: 'licenses', label: 'Licenses', icon: Shield },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'logs', label: 'Sign-in Logs', icon: FileText }
  ];

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Actions</h3>
          <div className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800 rounded-lg p-6">
          {activeTab === 'users' && <UserManagement result={result} setResult={setResult} />}
          {activeTab === 'licenses' && <LicenseManagement result={result} setResult={setResult} />}
          {activeTab === 'groups' && <GroupManagement result={result} setResult={setResult} />}
          {activeTab === 'logs' && <SignInLogs result={result} setResult={setResult} />}
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ result, setResult }) => {
  const [action, setAction] = useState('create');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    userPrincipalName: '',
    password: '',
    usageLocation: 'US'
  });

  const handleCreateUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await window.electron.m365.createUser(formData);
      setResult(result);
      
      if (result.success) {
        setFormData({ displayName: '', userPrincipalName: '', password: '', usageLocation: 'US' });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await window.electron.m365.resetPassword(formData.userPrincipalName, formData.password);
      setResult(result);
      
      if (result.success) {
        setFormData({ ...formData, password: '' });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">User Management</h2>

      {/* Action Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAction('create')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            action === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Create User
        </button>
        <button
          onClick={() => setAction('reset')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            action === 'reset'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Reset Password
        </button>
      </div>

      {/* Forms */}
      {action === 'create' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">User Principal Name *</label>
            <input
              type="text"
              value={formData.userPrincipalName}
              onChange={(e) => setFormData({ ...formData, userPrincipalName: e.target.value })}
              placeholder="john.doe@contoso.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Temp@Password123"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">User will be required to change on first login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Usage Location</label>
            <input
              type="text"
              value={formData.usageLocation}
              onChange={(e) => setFormData({ ...formData, usageLocation: e.target.value })}
              placeholder="US"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">ISO 3166-1 alpha-2 country code (e.g., US, GB, CA)</p>
          </div>

          <button
            onClick={handleCreateUser}
            disabled={loading || !formData.displayName || !formData.userPrincipalName || !formData.password}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                Create User
              </>
            )}
          </button>
        </div>
      )}

      {action === 'reset' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">User Principal Name *</label>
            <input
              type="text"
              value={formData.userPrincipalName}
              onChange={(e) => setFormData({ ...formData, userPrincipalName: e.target.value })}
              placeholder="john.doe@contoso.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="NewTemp@Password123"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">User will be required to change on next login</p>
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading || !formData.userPrincipalName || !formData.password}
            className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                Reset Password
              </>
            )}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`mt-6 rounded-lg p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-semibold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                {result.success ? 'Operation Successful' : 'Operation Failed'}
              </p>
              {result.message && (
                <p className="text-slate-300 text-sm mb-2">{result.message}</p>
              )}
              {result.error && (
                <p className="text-red-300 text-sm mb-2">{result.error.message || result.error}</p>
              )}
              {result.data && (
                <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-auto max-h-64">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LicenseManagement = ({ result, setResult }) => {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState([]);
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    skuId: ''
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    const result = await window.electron.m365.getAvailableLicenses();
    if (result.success) {
      setLicenses(result.data);
    }
  };

  const handleAssignLicense = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await window.electron.m365.assignLicense(formData.userPrincipalName, formData.skuId);
      setResult(result);
      
      if (result.success) {
        setFormData({ userPrincipalName: '', skuId: '' });
        loadLicenses();
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">License Management</h2>

      {/* Available Licenses */}
      {licenses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Available Licenses</h3>
          <div className="grid grid-cols-2 gap-3">
            {licenses.map(license => (
              <div key={license.skuId} className="bg-slate-700 rounded-lg p-3">
                <p className="text-white font-medium text-sm">{license.skuPartNumber}</p>
                <p className="text-slate-400 text-xs mt-1">
                  Available: {license.available} / {license.prepaidUnits}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign License Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">User Principal Name *</label>
          <input
            type="text"
            value={formData.userPrincipalName}
            onChange={(e) => setFormData({ ...formData, userPrincipalName: e.target.value })}
            placeholder="john.doe@contoso.com"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">License SKU ID *</label>
          <select
            value={formData.skuId}
            onChange={(e) => setFormData({ ...formData, skuId: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a license...</option>
            {licenses.map(license => (
              <option key={license.skuId} value={license.skuId}>
                {license.skuPartNumber} ({license.available} available)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAssignLicense}
          disabled={loading || !formData.userPrincipalName || !formData.skuId}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Assigning License...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Assign License
            </>
          )}
        </button>
      </div>

      {result && <ResultDisplay result={result} />}
    </div>
  );
};

const GroupManagement = ({ result, setResult }) => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    groupId: ''
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const result = await window.electron.m365.listGroups();
    if (result.success) {
      setGroups(result.data);
    }
  };

  const handleAddToGroup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await window.electron.m365.addUserToGroup(formData.userPrincipalName, formData.groupId);
      setResult(result);
      
      if (result.success) {
        setFormData({ userPrincipalName: '', groupId: '' });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Group Management</h2>

      {/* Groups List */}
      {groups.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Available Groups ({groups.length})</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {groups.slice(0, 20).map(group => (
              <div key={group.id} className="bg-slate-700 rounded-lg p-3">
                <p className="text-white font-medium text-sm">{group.displayName}</p>
                {group.description && (
                  <p className="text-slate-400 text-xs mt-1">{group.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Group Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">User Principal Name *</label>
          <input
            type="text"
            value={formData.userPrincipalName}
            onChange={(e) => setFormData({ ...formData, userPrincipalName: e.target.value })}
            placeholder="john.doe@contoso.com"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Group *</label>
          <select
            value={formData.groupId}
            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a group...</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.displayName}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddToGroup}
          disabled={loading || !formData.userPrincipalName || !formData.groupId}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding to Group...
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              Add User to Group
            </>
          )}
        </button>
      </div>

      {result && <ResultDisplay result={result} />}
    </div>
  );
};

const SignInLogs = ({ result, setResult }) => {
  const [loading, setLoading] = useState(false);
  const [userPrincipalName, setUserPrincipalName] = useState('');
  const [limit, setLimit] = useState(10);

  const handleGetLogs = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await window.electron.m365.getSignInLogs(userPrincipalName, limit);
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Sign-in Logs</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">User Principal Name *</label>
          <input
            type="text"
            value={userPrincipalName}
            onChange={(e) => setUserPrincipalName(e.target.value)}
            placeholder="john.doe@contoso.com"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Number of Logs</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            min="1"
            max="50"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleGetLogs}
          disabled={loading || !userPrincipalName}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Retrieving Logs...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Get Sign-in Logs
            </>
          )}
        </button>
      </div>

      {result && result.success && result.data && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">
            Sign-in Events ({result.data.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {result.data.map((log, index) => (
              <div key={index} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{log.userDisplayName}</p>
                    <p className="text-slate-400 text-sm">{log.userPrincipalName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    log.status?.errorCode === 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {log.status?.errorCode === 0 ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <span className="text-slate-300 ml-2">{new Date(log.createdDateTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">App:</span>
                    <span className="text-slate-300 ml-2">{log.appDisplayName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">IP:</span>
                    <span className="text-slate-300 ml-2">{log.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-300 ml-2">{log.location?.city || 'Unknown'}, {log.location?.countryOrRegion || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !result.success && <ResultDisplay result={result} />}
    </div>
  );
};

const ResultDisplay = ({ result }) => {
  return (
    <div className={`mt-6 rounded-lg p-4 ${result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
      <div className="flex items-start gap-3">
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`font-semibold mb-2 ${result.success ? 'text-green-300' : 'text-red-300'}`}>
            {result.success ? 'Operation Successful' : 'Operation Failed'}
          </p>
          {result.message && (
            <p className="text-slate-300 text-sm mb-2">{result.message}</p>
          )}
          {result.error && (
            <div className="text-red-300 text-sm">
              <p className="font-medium">{result.error.message || result.error}</p>
              {result.error.details && (
                <p className="text-xs text-red-400 mt-1">{result.error.details}</p>
              )}
            </div>
          )}
          {result.data && (
            <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-auto max-h-64 mt-3">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default M365Dashboard;
