import React, { useState } from 'react';
import { Mail, Loader2, Search, ExternalLink, Paperclip } from 'lucide-react';
import SearchSelect from './SearchSelect';

const MailFlow = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    userPrincipalName: '',
    direction: 'all',
    counterpart: '',
    subjectContains: '',
    startDate: '',
    endDate: ''
  });

  const [users, setUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleUserSearch = async (searchTerm) => {
    if (searchTerm.length < 2) return;
    setSearchingUsers(true);
    setError('');
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
    } catch (err) {
      setSearchError(err?.message || 'Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);

    if (!formData.userPrincipalName) {
      setError('Mailbox user is required.');
      return;
    }

    const payload = {
      userPrincipalName: formData.userPrincipalName,
      direction: formData.direction,
      counterpart: formData.counterpart || undefined,
      subjectContains: formData.subjectContains || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      maxResults: 50
    };

    const result = await onSubmit(payload);
    if (result?.success) {
      setResults(result.messages || []);
    } else if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : result.error.message);
    } else {
      setError('Trace failed. See logs for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Mail Flow / Message Trace</h2>
          <p className="text-sm text-slate-400">
            Search recent messages in a mailbox by subject, counterpart and date range.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchSelect
          label="Mailbox User"
          value={formData.userPrincipalName}
          onChange={(value) => setFormData({ ...formData, userPrincipalName: value })}
          options={users}
          placeholder="Search by name, email, UPN..."
          loading={searchingUsers}
          onSearch={handleUserSearch}
          searchError={searchError}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Direction
            </label>
            <select
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Counterpart (sender / recipient)
            </label>
            <input
              type="email"
              value={formData.counterpart}
              onChange={(e) => setFormData({ ...formData, counterpart: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="someone@example.com (optional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Subject contains
          </label>
          <input
            type="text"
            value={formData.subjectContains}
            onChange={(e) => setFormData({ ...formData, subjectContains: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Keyword in subject (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Start Date (UTC)
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              End Date (UTC)
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Trace Messages
            </>
          )}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Results ({results.length} messages)
          </h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {results.map((msg) => {
              const dateStr = msg.dateFormatted || (msg.sentDateTime ? new Date(msg.sentDateTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : msg.receivedDateTime || '-');
              return (
                <div
                  key={msg.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800/80 p-4 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-slate-400 text-xs font-mono">{dateStr}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        msg.direction === 'Sent'
                          ? 'bg-blue-500/25 text-blue-300'
                          : msg.direction === 'Received'
                          ? 'bg-emerald-500/25 text-emerald-300'
                          : 'bg-slate-500/25 text-slate-400'
                      }`}
                    >
                      {msg.direction}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-slate-500 text-xs">{msg.folder}</span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-emerald-500/80 text-xs">{msg.status}</span>
                    {msg.hasAttachments === 'Yes' && (
                      <>
                        <span className="text-slate-500 text-xs">•</span>
                        <Paperclip className="w-3 h-3 text-slate-500" />
                      </>
                    )}
                    {msg.webLink && (
                      <a
                        href={msg.webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Outlook
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-slate-300 mb-1">
                    <span className="text-slate-500 shrink-0">From:</span>
                    <span className="break-all">{msg.from || '-'}</span>
                    <span className="text-slate-500 shrink-0">→</span>
                    <span className="text-slate-500 shrink-0">To:</span>
                    <span className="break-all">{msg.to || '-'}</span>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{msg.subject || '(No subject)'}</div>
                  {msg.bodyPreview && (
                    <p className="text-xs text-slate-500 line-clamp-2">{msg.bodyPreview}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span>Read: {msg.isRead}</span>
                    <span>Importance: {msg.importance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MailFlow;

