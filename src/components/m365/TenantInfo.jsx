import React, { useState, useEffect } from 'react';
import { Building2, Download, Loader2, RefreshCw, Globe } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const TenantInfo = () => {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [userLicenseReport, setUserLicenseReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadTenantInfo();
  }, []);

  const loadTenantInfo = async () => {
    setLoading(true);
    try {
      const result = await window.electron.m365.getTenantInfo();
      if (result.success) {
        setTenantInfo(result.organization);
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLicenseReport = async () => {
    setLoadingReport(true);
    try {
      const result = await window.electron.m365.getUserLicenseReport();
      if (result.success) {
        setUserLicenseReport(result.users);
      }
    } catch (error) {
      console.error('Failed to load user license report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExportReport = () => {
    if (userLicenseReport.length > 0) {
      exportToCSV(userLicenseReport, 'user_license_report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tenantInfo && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{tenantInfo.displayName}</h3>
              <p className="text-sm text-slate-400">Organization Information</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Verified Domains</p>
              <div className="space-y-1">
                {tenantInfo.verifiedDomains?.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-blue-400" />
                    <span className="text-sm text-white">{domain.name}</span>
                    {domain.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Preferred Language</p>
              <p className="text-lg font-semibold text-white">
                {tenantInfo.preferredLanguage || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">User License Report</h3>
          <div className="flex gap-2">
            <button
              onClick={loadUserLicenseReport}
              disabled={loadingReport}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loadingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loadingReport ? 'Loading...' : 'Generate Report'}
            </button>
            {userLicenseReport.length > 0 && (
              <button
                onClick={handleExportReport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {userLicenseReport.length > 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Licenses</th>
                    <th className="px-4 py-3 text-center text-slate-300 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {userLicenseReport.map((user, index) => (
                    <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-slate-300">{user.displayName}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{user.userPrincipalName}</td>
                      <td className="px-4 py-3">
                        {user.accountEnabled ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-semibold">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">
                        {user.licenses || 'None'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">
                          {user.licenseCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p>Click "Generate Report" to view all users and their licenses</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantInfo;
