import React, { useState, useEffect } from 'react';
import { Users, Loader2, UserPlus, UserMinus } from 'lucide-react';
import SearchSelect from './SearchSelect';

const ManageGroups = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    groupId: '',
    action: 'add'
  });

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupType, setGroupType] = useState('all');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadGroups();
  }, [groupType]);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const result = await window.electron.m365.listGroupsByType(groupType);
      if (result.success) {
        const groupOptions = result.groups.map(g => {
          let type = 'Unknown';
          if (g.groupTypes?.includes('Unified')) type = 'M365';
          else if (g.securityEnabled && !g.mailEnabled) type = 'Security';
          else if (g.mailEnabled && !g.securityEnabled) type = 'Distribution';
          
          return {
            value: g.id,
            label: g.displayName,
            description: `${type} - ${g.mail || g.id}`
          };
        });
        setGroups(groupOptions);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoadingGroups(false);
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
    if (!formData.groupId) newErrors.groupId = 'Required';
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
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Action</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, action: 'add' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.action === 'add'
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <UserPlus className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Add to Group</p>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, action: 'remove' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              formData.action === 'remove'
                ? 'border-red-500 bg-red-500/20 text-red-300'
                : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            <UserMinus className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">Remove from Group</p>
          </button>
        </div>
      </div>

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

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-300">
            Group <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            {['all', 'security', 'm365', 'distribution'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setGroupType(type)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  groupType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <SearchSelect
          value={formData.groupId}
          onChange={(value) => setFormData({ ...formData, groupId: value })}
          options={groups}
          placeholder="Select group..."
          loading={loadingGroups}
          required
          error={errors.groupId}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full px-6 py-3 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
          formData.action === 'add'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : formData.action === 'add' ? (
          <>
            <UserPlus className="w-5 h-5" />
            Add User to Group
          </>
        ) : (
          <>
            <UserMinus className="w-5 h-5" />
            Remove User from Group
          </>
        )}
      </button>
    </form>
  );
};

export default ManageGroups;
