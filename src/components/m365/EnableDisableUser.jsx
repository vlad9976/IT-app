import React, { useState } from 'react';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import SearchSelect from './SearchSelect';

const EnableDisableUser = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    action: 'disable',
    removeLicenses: false,
    revokeSessions: true,
    forwardEmailsTo: ''
  });

  const [users, setUsers] = useState([]);
  const [forwardToUsers, setForwardToUsers] = useState([]);
  const [searchingForwardTo, setSearchingForwardTo] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [forwardSearchError, setForwardSearchError] = useState(null);
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
          description: `${u.userPrincipalName} - ${u.accountEnabled ? 'Enabled' : 'Disabled'}`
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

  const handleForwardToSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    setSearchingForwardTo(true);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
        setForwardSearchError(null);
        const userOptions = result.users.map(u => ({
          value: u.userPrincipalName,
          label: u.displayName,
          description: u.userPrincipalName
        }));
        setForwardToUsers(userOptions);
      } else {
        setForwardSearchError(result.error?.message || 'Failed to search users');
      }
    } catch (error) {
      setForwardSearchError(error?.message || 'Failed to search users');
    } finally {
      setSearchingForwardTo(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.userPrincipalName) newErrors.userPrincipalName = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const selectedForwardTo = forwardToUsers.find(u => u.value === formData.forwardEmailsTo);
      onSubmit({
        ...formData,
        forwardEmailsToName: selectedForwardTo?.label || formData.forwardEmailsTo
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SearchSelect
        label="User"
        value={formData.userPrincipalName}
        onChange={(value) => setFormData({ ...formData, userPrincipalName: value })}
        options={users}
        placeholder="Search by name, email, UPN..."
        loading={searchingUsers}
        onSearch={handleUserSearch}
        searchError={searchError}
        required
        error={errors.userPrincipalName}
      />

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Action</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, action: 'enable' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.action === 'enable'
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <UserCheck className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Enable User</p>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, action: 'disable' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.action === 'disable'
                ? 'border-red-500 bg-red-500/20 text-red-300'
                : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <UserX className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Disable User</p>
          </button>
        </div>
      </div>

      {formData.action === 'disable' && (
        <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <p className="text-sm font-medium text-slate-300 mb-2">Additional Actions:</p>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Forward emails to <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <SearchSelect
              value={formData.forwardEmailsTo}
              onChange={(value) => setFormData({ ...formData, forwardEmailsTo: value })}
              options={forwardToUsers}
              placeholder="Search by name, email, UPN..."
              loading={searchingForwardTo}
              onSearch={handleForwardToSearch}
              searchError={forwardSearchError}
              error={errors.forwardEmailsTo}
            />
            <p className="text-xs text-slate-500 mt-1">
              Emails sent to the disabled user&apos;s mailbox will be forwarded to this user
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.removeLicenses}
              onChange={(e) => setFormData({ ...formData, removeLicenses: e.target.checked })}
              className="rounded"
            />
            Remove all licenses
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.revokeSessions}
              onChange={(e) => setFormData({ ...formData, revokeSessions: e.target.checked })}
              className="rounded"
            />
            Revoke all sign-in sessions
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
          formData.action === 'enable'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : formData.action === 'enable' ? (
          <>
            <UserCheck className="w-5 h-5" />
            Enable User
          </>
        ) : (
          <>
            <UserX className="w-5 h-5" />
            Disable User
          </>
        )}
      </button>
    </form>
  );
};

export default EnableDisableUser;
