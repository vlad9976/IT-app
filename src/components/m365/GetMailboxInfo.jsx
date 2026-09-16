import React, { useState } from 'react';
import { Mail, Loader2, User, Settings, MessageSquare, Award, LogIn, Forward } from 'lucide-react';
import SearchSelect from './SearchSelect';

const GetMailboxInfo = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({ userPrincipalName: '' });
  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [info, setInfo] = useState(null);
  const [errors, setErrors] = useState({});

  const handleUserSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    setSearchingUsers(true);
    setSearchError(null);
    try {
      const result = await window.electron.m365.searchUsers(searchTerm, 20);
      if (result.success) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userPrincipalName) {
      setErrors({ userPrincipalName: 'Required' });
      return;
    }
    setErrors({});
    setInfo(null);
    if (onSubmit) {
      const result = await onSubmit(formData.userPrincipalName);
      if (result?.success && result?.info) {
        setInfo(result.info);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Get User Mailbox Info</h2>
          <p className="text-sm text-slate-400">
            View mailbox settings, licenses, last sign-in, auto-reply, and user details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SearchSelect
          label="User"
          value={formData.userPrincipalName}
          onChange={(value) => { setFormData({ userPrincipalName: value }); setInfo(null); }}
          options={users}
          placeholder="Search by name, email, UPN..."
          loading={searchingUsers}
          onSearch={handleUserSearch}
          searchError={searchError}
          required
          error={errors.userPrincipalName}
        />

        <button
          type="submit"
          disabled={loading || !formData.userPrincipalName}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
          Get Mailbox Info
        </button>
      </form>

      {info && (
        <MailboxInfoCard info={info} />
      )}
    </div>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors">
    {Icon && <Icon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-slate-200 mt-0.5 break-words">{value ?? '—'}</p>
    </div>
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/80 bg-slate-700/30">
      {Icon && <Icon className="w-4 h-4 flex-shrink-0 text-blue-400" />}
      <h4 className="font-semibold text-slate-200">{title}</h4>
    </div>
    <div className="divide-y divide-slate-700/50">
      {children}
    </div>
  </div>
);

const MailboxInfoCard = ({ info }) => {
  const { user, mailbox, autoReply, lastSignIn, forwarding } = info;

  const formatDate = (dt) => {
    if (!dt) return null;
    try {
      const d = new Date(dt);
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return dt;
    }
  };

  return (
    <div className="space-y-4">
      {/* User header card */}
      <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-800/80 p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user.displayName}</h3>
            <p className="text-slate-400 text-sm">{user.userPrincipalName}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                user.accountEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {user.accountEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {mailbox.hasMailbox && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                  Has Mailbox
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Info */}
        <Section icon={User} title="User Info">
          <InfoRow icon={Mail} label="Primary Email" value={user.mail} />
          <InfoRow label="Job Title" value={user.jobTitle} />
          <InfoRow label="Department" value={user.department} />
          <InfoRow
            label="Account Status"
            value={user.accountEnabled ? 'Enabled' : 'Disabled'}
          />
        </Section>

        {/* Licenses */}
        <Section icon={Award} title="Licenses">
          {user.licenses && user.licenses.length > 0 ? (
            <div className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                {user.licenseCount} license{user.licenseCount !== 1 ? 's' : ''} assigned
              </p>
              <div className="flex flex-wrap gap-2">
                {user.licenses.map((lic) => (
                  <span
                    key={lic}
                    className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-200 text-sm font-medium"
                  >
                    {lic}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <InfoRow label="Assigned" value="None" />
          )}
        </Section>

        {/* Last Sign-in & Forwarding */}
        <Section icon={LogIn} title="Last Sign-in">
          <InfoRow
            label="Last successful sign-in"
            value={formatDate(lastSignIn) || 'Never'}
          />
        </Section>

        <Section icon={Forward} title="Forwarding">
          <InfoRow
            label="Email forwarding"
            value={forwarding || 'Not available via Graph API (check Exchange Admin Center)'}
          />
        </Section>

        {/* Mailbox Settings */}
        <Section icon={Settings} title="Mailbox Settings">
          <InfoRow label="Time Zone" value={mailbox.timeZone} />
          <InfoRow label="Language" value={mailbox.language} />
          <InfoRow label="Date Format" value={mailbox.dateFormat} />
          <InfoRow label="Time Format" value={mailbox.timeFormat} />
        </Section>

        {/* Auto-Reply */}
        <Section icon={MessageSquare} title="Auto-Reply (Out of Office)">
          <InfoRow
            label="Status"
            value={autoReply.status === 'disabled' ? 'Off' : autoReply.status === 'alwaysEnabled' ? 'Always on' : 'Scheduled'}
          />
          {autoReply.status !== 'disabled' && (
            <>
              {autoReply.internalMessage && (
                <InfoRow label="Internal Reply" value={autoReply.internalMessage} />
              )}
              {autoReply.externalMessage && (
                <InfoRow label="External Reply" value={autoReply.externalMessage} />
              )}
              {autoReply.scheduledStart && (
                <InfoRow label="Scheduled Start" value={formatDate(autoReply.scheduledStart)} />
              )}
              {autoReply.scheduledEnd && (
                <InfoRow label="Scheduled End" value={formatDate(autoReply.scheduledEnd)} />
              )}
            </>
          )}
        </Section>
      </div>
    </div>
  );
};

export default GetMailboxInfo;
export { MailboxInfoCard };
