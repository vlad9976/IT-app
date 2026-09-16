import React, { useState, useEffect } from 'react';
import { Key, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import SearchSelect from './SearchSelect';
import { generatePassword } from '../../utils/csvExport';

const ResetPassword = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    newPassword: '',
    forcePasswordChange: true,
    revokeSessions: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (autoGenerate) {
      setFormData(prev => ({ ...prev, newPassword: generatePassword() }));
    }
  }, [autoGenerate]);

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
    
    if (!formData.userPrincipalName) newErrors.userPrincipalName = 'Required';
    if (!formData.newPassword) newErrors.newPassword = 'Required';
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">
            New Password <span className="text-red-400">*</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
              className="rounded"
            />
            Auto-generate
          </label>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            disabled={autoGenerate}
            className={`w-full px-4 py-2 pr-20 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.newPassword ? 'border-red-500' : 'border-slate-600'
            } ${autoGenerate ? 'opacity-70' : ''}`}
            placeholder="New password"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {autoGenerate && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, newPassword: generatePassword() })}
                className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 hover:bg-slate-600 rounded transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.forcePasswordChange}
            onChange={(e) => setFormData({ ...formData, forcePasswordChange: e.target.checked })}
            className="rounded"
          />
          Force password change on next sign-in
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.revokeSessions}
            onChange={(e) => setFormData({ ...formData, revokeSessions: e.target.checked })}
            className="rounded"
          />
          Revoke all active sign-in sessions
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
    </form>
  );
};

export default ResetPassword;
