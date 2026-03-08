import React, { useState, useEffect } from 'react';
import { Mail, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import SearchSelect from './SearchSelect';
import { generateCSVContent } from '../../utils/csvExport';

const MailboxInventory = ({ onSubmit, loading, onExportSuccess }) => {
  const [formData, setFormData] = useState({
    mailboxType: 'all',
    accountStatus: 'all',
    domain: '',
    includeLicenseDetails: true,
    includeSignInActivity: false
  });

  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [mailboxes, setMailboxes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const result = await window.electron.m365.getTenantDomains();
        if (result.success && result.domains) {
          const domainOptions = result.domains
            .filter(d => d.isVerified)
            .map(d => ({
              value: d.id,
              label: d.id,
              description: d.isDefault ? 'Default domain' : ''
            }));
          setDomains(domainOptions);
        }
      } catch (err) {
        console.error('Failed to load domains:', err);
      } finally {
        setLoadingDomains(false);
      }
    };
    loadDomains();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await onSubmit(formData);

    if (result?.success) {
      setMailboxes(result.mailboxes || []);
    } else {
      setError(result?.error?.message || result?.error || 'Failed to generate report');
    }
  };

  const handleExport = async () => {
    if (mailboxes.length === 0) return;

    const dateStr = new Date().toISOString().split('T')[0];
    const defaultFilename = `MailboxInventory_${dateStr}.csv`;
    const csvContent = generateCSVContent(mailboxes);

    if (window.electron?.saveFileDialog) {
      const result = await window.electron.saveFileDialog(defaultFilename, csvContent);
      if (result?.success) {
        onExportSuccess?.();
      }
    }
  };

  const previewRows = mailboxes.slice(0, 20);
  const hasMore = mailboxes.length > 20;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Mail className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Mailbox Inventory Report</h3>
          <p className="text-sm text-slate-400">Export mailbox data to CSV via Microsoft Graph</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mailbox Type</label>
            <select
              value={formData.mailboxType}
              onChange={(e) => setFormData({ ...formData, mailboxType: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="user">User Mailboxes</option>
              <option value="shared">Shared Mailboxes</option>
              <option value="disabled">Disabled Accounts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Status</label>
            <select
              value={formData.accountStatus}
              onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <SearchSelect
          label="Domain"
          value={formData.domain}
          onChange={(value) => setFormData({ ...formData, domain: value })}
          options={domains}
          placeholder="All domains"
          loading={loadingDomains}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeLicenseDetails}
              onChange={(e) => setFormData({ ...formData, includeLicenseDetails: e.target.checked })}
              className="rounded"
            />
            Include License Details
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeSignInActivity}
              onChange={(e) => setFormData({ ...formData, includeSignInActivity: e.target.checked })}
              className="rounded"
            />
            Include Sign-in Activity
          </label>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
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
              Generating Report...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" />
              Generate Report
            </>
          )}
        </button>
      </form>

      {mailboxes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {mailboxes.length} mailbox{mailboxes.length !== 1 ? 'es' : ''} found
              {hasMore && ` (showing first 20)`}
            </p>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Display Name</th>
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">UPN</th>
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Type</th>
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Enabled</th>
                    {formData.includeLicenseDetails && (
                      <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Licenses</th>
                    )}
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Location</th>
                    {formData.includeSignInActivity && (
                      <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Last Sign-in</th>
                    )}
                    <th className="px-3 py-2 text-left text-slate-300 font-semibold text-xs">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {previewRows.map((mb, index) => (
                    <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{mb.displayName}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs truncate max-w-[180px]">{mb.userPrincipalName}</td>
                      <td className="px-3 py-2 text-slate-300">{mb.mailboxType}</td>
                      <td className="px-3 py-2 text-slate-300">{mb.accountEnabled}</td>
                      {formData.includeLicenseDetails && (
                        <td className="px-3 py-2 text-slate-400 text-xs max-w-[150px] truncate">{mb.assignedLicenses}</td>
                      )}
                      <td className="px-3 py-2 text-slate-300">{mb.usageLocation}</td>
                      {formData.includeSignInActivity && (
                        <td className="px-3 py-2 text-slate-400 text-xs">
                          {mb.lastSignInDate ? new Date(mb.lastSignInDate).toLocaleDateString() : '-'}
                        </td>
                      )}
                      <td className="px-3 py-2 text-slate-400 text-xs">{mb.department}</td>
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

export default MailboxInventory;
