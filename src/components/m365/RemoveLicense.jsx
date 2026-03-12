import React, { useState, useEffect } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import SearchSelect from './SearchSelect';

const RemoveLicense = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    selectedLicenses: []
  });

  const [users, setUsers] = useState([]);
  const [userLicenses, setUserLicenses] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
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

  useEffect(() => {
    if (formData.userPrincipalName) {
      loadUserLicenses();
    } else {
      setUserLicenses([]);
      setFormData(prev => ({ ...prev, selectedLicenses: [] }));
    }
  }, [formData.userPrincipalName]);

  const loadUserLicenses = async () => {
    setLoadingLicenses(true);
    try {
      const result = await window.electron.m365.getUserLicenses(formData.userPrincipalName);
      if (result.success) {
        setUserLicenses(result.licenses);
      }
    } catch (error) {
      console.error('Failed to load user licenses:', error);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const toggleLicense = (skuId) => {
    setFormData(prev => ({
      ...prev,
      selectedLicenses: prev.selectedLicenses.includes(skuId)
        ? prev.selectedLicenses.filter(id => id !== skuId)
        : [...prev.selectedLicenses, skuId]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.userPrincipalName) newErrors.userPrincipalName = 'Required';
    if (formData.selectedLicenses.length === 0) newErrors.selectedLicenses = 'Select at least one license';
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
        onChange={(value) => setFormData({ ...formData, userPrincipalName: value, selectedLicenses: [] })}
        options={users}
        placeholder="Search by name, email, UPN..."
        loading={searchingUsers}
        onSearch={handleUserSearch}
        searchError={searchError}
        required
        error={errors.userPrincipalName}
      />

      {formData.userPrincipalName && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Assigned Licenses <span className="text-red-400">*</span>
          </label>
          
          {loadingLicenses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : userLicenses.length > 0 ? (
            <div className="space-y-2 bg-slate-800 p-4 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
              {userLicenses.map((license) => (
                <label
                  key={license.skuId}
                  className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedLicenses.includes(license.skuId)}
                    onChange={() => toggleLicense(license.skuId)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{license.skuPartNumber}</p>
                    <p className="text-xs text-slate-400">SKU ID: {license.skuId}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center">
              <p className="text-slate-400">No licenses assigned to this user</p>
            </div>
          )}
          
          {errors.selectedLicenses && (
            <p className="text-red-400 text-xs mt-1">{errors.selectedLicenses}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !formData.userPrincipalName}
        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Removing Licenses...
          </>
        ) : (
          <>
            <XCircle className="w-5 h-5" />
            Remove Selected Licenses
          </>
        )}
      </button>
    </form>
  );
};

export default RemoveLicense;
