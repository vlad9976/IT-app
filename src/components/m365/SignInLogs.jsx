import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Search, Calendar } from 'lucide-react';
import SearchSelect from './SearchSelect';
import { exportToCSV, formatDate } from '../../utils/csvExport';

const SignInLogs = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    startDate: '',
    endDate: '',
    filterType: 'all'
  });

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    setFormData(prev => ({
      ...prev,
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const result = await onSubmit(formData);
      if (result?.success) {
        setLogs(result.logs || []);
      }
    }
  };

  const handleExport = () => {
    if (logs.length > 0) {
      const exportData = logs.map(log => ({
        Date: formatDate(log.createdDateTime),
        User: log.userPrincipalName,
        Application: log.appDisplayName,
        IP: log.ipAddress,
        City: log.location?.city || 'N/A',
        Country: log.location?.countryOrRegion || 'N/A',
        Status: log.status?.errorCode === 0 ? 'Success' : 'Failed',
        ErrorCode: log.status?.errorCode || 0,
        ConditionalAccess: log.conditionalAccessStatus || 'N/A'
      }));
      exportToCSV(exportData, 'signin_logs');
    }
  };

  return (
    <div className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Filter</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'success', label: 'Successful Only' },
              { value: 'failed', label: 'Failed Only' }
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFormData({ ...formData, filterType: filter.value })}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  formData.filterType === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Logs...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Get Sign-in Logs
            </>
          )}
        </button>
      </form>

      {logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Results ({logs.length})
            </h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Application</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">IP Address</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">CA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {formatDate(log.createdDateTime)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.appDisplayName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.location?.city && log.location?.countryOrRegion
                          ? `${log.location.city}, ${log.location.countryOrRegion}`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {log.status?.errorCode === 0 ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {log.conditionalAccessStatus || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignInLogs;
