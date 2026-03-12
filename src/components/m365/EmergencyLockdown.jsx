import React, { useState } from 'react';
import { Shield, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import SearchSelect from './SearchSelect';
import ConfirmModal from './ConfirmModal';

const EmergencyLockdown = ({ onSubmit, loading }) => {
  const [userPrincipalName, setUserPrincipalName] = useState('');
  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lockdownResult, setLockdownResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleUserSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    setSearchingUsers(true);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
        setSearchError(null);
        const userOptions = result.users.map(u => ({
          value: u.userPrincipalName,
          label: u.displayName,
          description: u.userPrincipalName
        }));
        setUsers(userOptions);
      } else {
        setSearchError(result.error?.message || 'Failed to search users');
      }
    } catch (error) {
      setSearchError(error?.message || 'Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!userPrincipalName) newErrors.userPrincipalName = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    const result = await onSubmit(userPrincipalName);
    if (result?.success) {
      setLockdownResult(result);
    }
  };

  const selectedUser = users.find(u => u.value === userPrincipalName);

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-red-300 mb-2">Emergency Lockdown Protocol</p>
            <p className="text-slate-400 mb-2">This action will immediately:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Reset the user's password to a random secure password</li>
              <li>Disable the user account</li>
              <li>Revoke all active sign-in sessions</li>
            </ul>
            <p className="text-red-300 font-semibold mt-3">Use only in security incidents!</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SearchSelect
          label="User to Lock Down"
          value={userPrincipalName}
          onChange={setUserPrincipalName}
          options={users}
          placeholder="Search by name, email, UPN..."
          loading={searchingUsers}
          onSearch={handleUserSearch}
          searchError={searchError}
          required
          error={errors.userPrincipalName}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Executing Lockdown...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Execute Emergency Lockdown
            </>
          )}
        </button>
      </form>

      {lockdownResult && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Lockdown Complete
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Password Reset</span>
              <span className={lockdownResult.results.passwordReset ? 'text-green-400' : 'text-red-400'}>
                {lockdownResult.results.passwordReset ? '✓ Success' : '✗ Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Account Disabled</span>
              <span className={lockdownResult.results.accountDisabled ? 'text-green-400' : 'text-red-400'}>
                {lockdownResult.results.accountDisabled ? '✓ Success' : '✗ Failed'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Sessions Revoked</span>
              <span className={lockdownResult.results.sessionsRevoked ? 'text-green-400' : 'text-red-400'}>
                {lockdownResult.results.sessionsRevoked ? '✓ Success' : '✗ Failed'}
              </span>
            </div>

            {lockdownResult.newPassword && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-semibold text-yellow-300 mb-2">New Temporary Password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-900 rounded text-green-400 font-mono text-sm">
                    {showPassword ? lockdownResult.newPassword : '••••••••••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(lockdownResult.newPassword)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-xs"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Save this password securely. It won't be shown again.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="Execute Emergency Lockdown?"
        message={`Are you sure you want to lock down this user?\n\n${selectedUser?.label || userPrincipalName}\n\nThis will:\n• Reset password\n• Disable account\n• Revoke all sessions\n\nThis action should only be used in security incidents.`}
        confirmText="Execute Lockdown"
        danger
        loading={loading}
      />
    </div>
  );
};

export default EmergencyLockdown;
