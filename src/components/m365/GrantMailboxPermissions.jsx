import React, { useState } from 'react';
import { Mail, Copy, FileCode, AlertCircle, Play } from 'lucide-react';
import SearchSelect from './SearchSelect';

const GrantMailboxPermissions = ({ onCopySuccess, onRunSuccess, onRunError }) => {
  const [formData, setFormData] = useState({
    mailboxIdentity: '',
    grantToUser: '',
    permissionType: 'fullaccess',
    action: 'grant',
    autoMapping: true
  });

  const [mailboxUsers, setMailboxUsers] = useState([]);
  const [grantUsers, setGrantUsers] = useState([]);
  const [searchingMailbox, setSearchingMailbox] = useState(false);
  const [searchingGrant, setSearchingGrant] = useState(false);
  const [searchErrorMailbox, setSearchErrorMailbox] = useState(null);
  const [searchErrorGrant, setSearchErrorGrant] = useState(null);
  const [generatedScript, setGeneratedScript] = useState('');
  const [errors, setErrors] = useState({});

  const handleMailboxSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    setSearchingMailbox(true);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
        setMailboxUsers(result.users.map(u => ({
          value: u.userPrincipalName,
          label: u.displayName,
          description: u.userPrincipalName
        })));
      }
    } catch (err) {
      console.error('Mailbox search error:', err);
    } finally {
      setSearchingMailbox(false);
    }
  };

  const handleGrantUserSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    setSearchingGrant(true);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
        setSearchErrorGrant(null);
        setGrantUsers(result.users.map(u => ({
          value: u.userPrincipalName,
          label: u.displayName,
          description: u.userPrincipalName
        })));
      } else {
        setSearchErrorGrant(result.error?.message || 'Failed to search users');
      }
    } catch (err) {
      setSearchErrorGrant(err?.message || 'Failed to search users');
    } finally {
      setSearchingGrant(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.mailboxIdentity) newErrors.mailboxIdentity = 'Required';
    if (!formData.grantToUser) newErrors.grantToUser = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateScript = (e) => {
    e.preventDefault();
    setGeneratedScript('');
    if (!validate()) return;

    const mailbox = formData.mailboxIdentity;
    const user = formData.grantToUser;
    const isGrant = formData.action === 'grant';
    const isFullAccess = formData.permissionType === 'fullaccess';

    const lines = [
      '# Exchange Online - Grant/Remove Mailbox Permissions',
      '# Requires: Connect-ExchangeOnline (Exchange Online Management module)',
      '#',
      ''
    ];

    if (isFullAccess) {
      if (isGrant) {
        const autoMapping = formData.autoMapping ? '$true' : '$false';
        lines.push(`Add-MailboxPermission -Identity "${mailbox}" -User "${user}" -AccessRights FullAccess -InheritanceType All -AutoMapping ${autoMapping}`);
      } else {
        lines.push(`Remove-MailboxPermission -Identity "${mailbox}" -User "${user}" -AccessRights FullAccess -Confirm:$false`);
      }
    } else {
      if (isGrant) {
        lines.push(`Add-RecipientPermission -Identity "${mailbox}" -Trustee "${user}" -AccessRights SendAs`);
      } else {
        lines.push(`Remove-RecipientPermission -Identity "${mailbox}" -Trustee "${user}" -AccessRights SendAs -Confirm:$false`);
      }
    }

    setGeneratedScript(lines.join('\n'));
  };

  const handleCopy = async () => {
    if (!generatedScript) return;
    try {
      await navigator.clipboard.writeText(generatedScript);
      onCopySuccess?.();
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleRunPowerShell = async () => {
    if (!generatedScript) return;
    if (typeof window.electron?.runPowerShell !== 'function') {
      onRunError?.('Run PowerShell is not available. Restart the app to use this feature.');
      return;
    }
    try {
      const result = await window.electron.runPowerShell(generatedScript);
      if (result.success) {
        onRunSuccess?.();
      } else {
        onRunError?.(result.error || 'Failed to run PowerShell');
      }
    } catch (err) {
      onRunError?.(err.message || 'Failed to run PowerShell');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Grant Mailbox Permissions</h2>
          <p className="text-sm text-slate-400">
            Grant Full Access or Send As permissions to a mailbox. Generates Exchange Online PowerShell.
          </p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-amber-300 mb-1">Exchange Online required</p>
            <p className="text-slate-400">
              Run these commands in Exchange Online PowerShell. Connect first with{' '}
              <code className="bg-slate-800 px-1 rounded">Connect-ExchangeOnline</code>.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={generateScript} className="space-y-4">
        <SearchSelect
          label="Mailbox"
          value={formData.mailboxIdentity}
          onChange={(v) => setFormData({ ...formData, mailboxIdentity: v })}
          options={mailboxUsers}
          placeholder="Search by name, email, UPN..."
          loading={searchingMailbox}
          onSearch={handleMailboxSearch}
          searchError={searchErrorMailbox}
          required
          error={errors.mailboxIdentity}
        />

        <SearchSelect
          label="User to grant permission to"
          value={formData.grantToUser}
          onChange={(v) => setFormData({ ...formData, grantToUser: v })}
          options={grantUsers}
          placeholder="Search by name, email, UPN..."
          loading={searchingGrant}
          onSearch={handleGrantUserSearch}
          searchError={searchErrorGrant}
          required
          error={errors.grantToUser}
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Permission type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, permissionType: 'fullaccess' })}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                formData.permissionType === 'fullaccess'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <p className="font-semibold">Full Access</p>
              <p className="text-xs mt-0.5 opacity-80">Open mailbox, read and send mail</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, permissionType: 'sendas' })}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                formData.permissionType === 'sendas'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <p className="font-semibold">Send As</p>
              <p className="text-xs mt-0.5 opacity-80">Send email as the mailbox (no delegation notice)</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, action: 'grant' })}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.action === 'grant'
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              Grant
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, action: 'remove' })}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                formData.action === 'remove'
                  ? 'border-red-500 bg-red-500/20 text-red-300'
                  : 'border-slate-600 bg-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              Remove
            </button>
          </div>
        </div>

        {formData.permissionType === 'fullaccess' && formData.action === 'grant' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoMapping"
              checked={formData.autoMapping}
              onChange={(e) => setFormData({ ...formData, autoMapping: e.target.checked })}
              className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="autoMapping" className="text-sm text-slate-300">
              Auto-mapping (add mailbox to delegate&apos;s Outlook profile automatically)
            </label>
          </div>
        )}

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
        >
          <FileCode className="w-4 h-4" />
          Generate script
        </button>
      </form>

      {generatedScript && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Generated PowerShell</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunPowerShell}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium inline-flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Run in PowerShell
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm inline-flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-xs text-green-400 overflow-x-auto">
            {generatedScript}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GrantMailboxPermissions;
