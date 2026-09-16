import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import SearchSelect from './SearchSelect';
import { generatePassword } from '../../utils/csvExport';

const CreateUser = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    username: '',
    domain: '',
    usageLocation: 'US',
    password: '',
    forcePasswordChange: true,
    accountEnabled: true,
    jobTitle: '',
    department: '',
    mobilePhone: '',
    manager: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      setFormData(prev => ({
        ...prev,
        displayName: `${prev.firstName} ${prev.lastName}`
      }));
    }
  }, [formData.firstName, formData.lastName]);

  useEffect(() => {
    if (autoGenerate) {
      setFormData(prev => ({ ...prev, password: generatePassword() }));
    }
  }, [autoGenerate]);

  const loadDomains = async () => {
    try {
      const result = await window.electron.m365.getTenantDomains();
      if (result.success) {
        const domainOptions = result.domains
          .filter(d => d.isVerified)
          .map(d => ({
            value: d.id,
            label: d.id,
            description: d.isDefault ? 'Default domain' : ''
          }));
        setDomains(domainOptions);
        
        const defaultDomain = result.domains.find(d => d.isDefault);
        if (defaultDomain) {
          setFormData(prev => ({ ...prev, domain: defaultDomain.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoadingDomains(false);
    }
  };

  const validate = (passwordOverride) => {
    const pwd = passwordOverride ?? formData.password;
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.username.trim()) newErrors.username = 'Required';
    if (!formData.domain) newErrors.domain = 'Required';
    if (!pwd) newErrors.password = 'Required';
    else if (pwd.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPassword = autoGenerate ? generatePassword() : formData.password;
    if (!validate(finalPassword)) return;

    const userData = {
      accountEnabled: formData.accountEnabled,
      displayName: formData.displayName,
      mailNickname: formData.username,
      userPrincipalName: `${formData.username}@${formData.domain}`,
      passwordProfile: {
        forceChangePasswordNextSignIn: formData.forcePasswordChange,
        password: finalPassword
      },
      usageLocation: formData.usageLocation
    };

    if (formData.jobTitle) userData.jobTitle = formData.jobTitle;
    if (formData.department) userData.department = formData.department;
    if (formData.mobilePhone) userData.mobilePhone = formData.mobilePhone;

    onSubmit(userData, formData.manager);
  };

  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'IL', label: 'Israel' },
    { value: 'IN', label: 'India' },
    { value: 'JP', label: 'Japan' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="John"
          />
          {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="Doe"
          />
          {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : 'border-slate-600'
            }`}
            placeholder="john.doe"
          />
          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
        </div>

        <SearchSelect
          label="Domain"
          value={formData.domain}
          onChange={(value) => setFormData({ ...formData, domain: value })}
          options={domains}
          placeholder="Select domain"
          loading={loadingDomains}
          required
          error={errors.domain}
        />
      </div>

      <SearchSelect
        label="Usage Location"
        value={formData.usageLocation}
        onChange={(value) => setFormData({ ...formData, usageLocation: value })}
        options={countryOptions}
        required
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">
            Temporary Password <span className="text-red-400">*</span>
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={autoGenerate}
            className={`w-full px-4 py-2 pr-20 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-slate-600'
            } ${autoGenerate ? 'opacity-70' : ''}`}
            placeholder="Password"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {autoGenerate && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: generatePassword() })}
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
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.forcePasswordChange}
          onChange={(e) => setFormData({ ...formData, forcePasswordChange: e.target.checked })}
          className="rounded"
        />
        Force password change on first sign-in
      </label>

      <div className="border-t border-slate-700 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? '− Hide' : '+ Show'} Advanced Options
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IT Administrator"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IT"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Phone</label>
            <input
              type="tel"
              value={formData.mobilePhone}
              onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1-555-123-4567"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.accountEnabled}
              onChange={(e) => setFormData({ ...formData, accountEnabled: e.target.checked })}
              className="rounded"
            />
            Account Enabled
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Create User
          </>
        )}
      </button>
    </form>
  );
};

export default CreateUser;
