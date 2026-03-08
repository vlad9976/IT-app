import React, { useState, useEffect } from 'react';
import { Award, Loader2 } from 'lucide-react';
import SearchSelect from './SearchSelect';

const AssignLicense = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    skuId: '',
    removeExisting: false
  });

  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingLicenses, setLoadingLicenses] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const result = await window.electron.m365.getAvailableLicenses();
      if (result.success) {
        const raw = result.licenses || result.data || [];
        const licenseOptions = raw
          .filter(lic => lic.capabilityStatus === 'Enabled' && lic.available > 0)
          .map(lic => ({
            value: lic.skuId,
            label: lic.skuPartNumber,
            description: `${lic.consumedUnits} of ${lic.prepaidUnits.enabled} assigned (available: ${lic.available})`
          }));
        setLicenses(licenseOptions);
      }
    } catch (error) {
      console.error('Failed to load licenses:', error);
    } finally {
      setLoadingLicenses(false);
    }
  };

  const handleUserSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    
    setSearchingUsers(true);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
        const userOptions = result.users.map(u => ({
          value: u.userPrincipalName,
          label: u.displayName,
          description: u.userPrincipalName
        }));
        setUsers(userOptions);
      }
    } catch (error) {
      console.error('User search error:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.userPrincipalName) newErrors.userPrincipalName = 'Required';
    if (!formData.skuId) newErrors.skuId = 'Required';
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
        required
        error={errors.userPrincipalName}
      />

      <SearchSelect
        label="License"
        value={formData.skuId}
        onChange={(value) => setFormData({ ...formData, skuId: value })}
        options={licenses}
        placeholder="Select license..."
        loading={loadingLicenses}
        required
        error={errors.skuId}
      />

      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.removeExisting}
          onChange={(e) => setFormData({ ...formData, removeExisting: e.target.checked })}
          className="rounded"
        />
        Remove existing licenses before assigning
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Assigning License...
          </>
        ) : (
          <>
            <Award className="w-5 h-5" />
            Assign License
          </>
        )}
      </button>
    </form>
  );
};

export default AssignLicense;
