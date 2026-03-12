import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import SearchSelect from './SearchSelect';
import ConfirmModal from './ConfirmModal';

const DeleteUser = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    permanent: false
  });

  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (!formData.userPrincipalName) newErrors.userPrincipalName = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSubmit(formData);
  };

  const selectedUser = users.find(u => u.value === formData.userPrincipalName);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-semibold text-red-300 mb-1">Warning: Destructive Action</p>
              <p className="text-slate-400">
                Deleting a user will remove their account and all associated data. 
                {formData.permanent 
                  ? ' Permanent deletion cannot be undone.' 
                  : ' Soft-deleted users can be restored within 30 days.'}
              </p>
            </div>
          </div>
        </div>

        <SearchSelect
          label="User to Delete"
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
          <label className="block text-sm font-medium text-slate-300 mb-3">Delete Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, permanent: false })}
              className={`p-4 rounded-lg border-2 transition-all ${
                !formData.permanent
                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Trash2 className="w-6 h-6 mx-auto mb-2" />
              <p className="font-semibold">Soft Delete</p>
              <p className="text-xs mt-1 opacity-80">Recoverable for 30 days</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, permanent: true })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.permanent
                  ? 'border-red-500 bg-red-500/20 text-red-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
              <p className="font-semibold">Hard Delete</p>
              <p className="text-xs mt-1 opacity-80">Permanent & irreversible</p>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Deleting User...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              Delete User
            </>
          )}
        </button>
      </form>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={formData.permanent ? 'Permanent Delete User?' : 'Delete User?'}
        message={`Are you sure you want to ${formData.permanent ? 'permanently' : 'soft'} delete:\n\n${selectedUser?.label || formData.userPrincipalName}\n\n${
          formData.permanent 
            ? 'This action CANNOT be undone!' 
            : 'This user can be restored within 30 days.'
        }`}
        confirmText={formData.permanent ? 'Permanently Delete' : 'Delete'}
        danger
        loading={loading}
      />
    </>
  );
};

export default DeleteUser;
