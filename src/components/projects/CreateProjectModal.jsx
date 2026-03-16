import React, { useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import TaskChecklist from './TaskChecklist';
import { useToast } from '../m365/useToast';

const STATUS_OPTIONS = ['Planned', 'In Progress', 'Blocked', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function CreateProjectModal({ isOpen, onClose, onCreated, searchUsers }) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    projectName: '',
    owner: null,
    assignedTo: [],
    status: 'Planned',
    priority: 'Medium',
    startDate: '',
    dueDate: '',
    description: '',
    tasks: { tasks: [] }
  });
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [assignedSearch, setAssignedSearch] = useState('');
  const [assignedOptions, setAssignedOptions] = useState([]);

  const update = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handleOwnerSearch = useCallback(async (term) => {
    setOwnerSearch(term);
    if (!window.electron?.m365?.searchUsers || term.length < 2) {
      setOwnerOptions([]);
      return;
    }
    try {
      const res = await window.electron.m365.searchUsers(term, 10);
      if (res?.value) {
        setOwnerOptions(res.value.map((u) => ({ displayName: u.displayName, userPrincipalName: u.userPrincipalName })));
      } else {
        setOwnerOptions([]);
      }
    } catch (_) {
      setOwnerOptions([]);
    }
  }, []);

  const handleAssignedSearch = useCallback(async (term) => {
    setAssignedSearch(term);
    if (!window.electron?.m365?.searchUsers || term.length < 2) {
      setAssignedOptions([]);
      return;
    }
    try {
      const res = await window.electron.m365.searchUsers(term, 10);
      if (res?.value) {
        setAssignedOptions(res.value.map((u) => ({ displayName: u.displayName, userPrincipalName: u.userPrincipalName })));
      } else {
        setAssignedOptions([]);
      }
    } catch (_) {
      setAssignedOptions([]);
    }
  }, []);

  const addAssigned = (user) => {
    if (form.assignedTo.some((a) => (a.userPrincipalName || a.email) === (user.userPrincipalName || user.email))) return;
    update('assignedTo', [...form.assignedTo, user]);
    setAssignedSearch('');
    setAssignedOptions([]);
  };

  const removeAssigned = (index) => {
    update('assignedTo', form.assignedTo.filter((_, i) => i !== index));
  };

  const reset = () => {
    setForm({
      projectName: '',
      owner: null,
      assignedTo: [],
      status: 'Planned',
      priority: 'Medium',
      startDate: '',
      dueDate: '',
      description: '',
      tasks: { tasks: [] }
    });
    setOwnerSearch('');
    setOwnerOptions([]);
    setAssignedSearch('');
    setAssignedOptions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) {
      showError('Project name is required');
      return;
    }
    if (!window.electron?.projects?.create) {
      showError('Projects API not available');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        owner: form.owner,
        assignedTo: form.assignedTo,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        description: form.description || '',
        tasks: form.tasks,
        createdByDisplay: form.owner?.displayName || 'Current User'
      };
      const result = await window.electron.projects.create(payload);
      if (result.success) {
        success('Project created');
        reset();
        onCreated?.(result.item);
        onClose();
      } else {
        const msg = result?.error?.message || result?.error || 'Failed to create project';
        showError(msg);
      }
    } catch (err) {
      showError(err?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <h2 className="text-lg font-semibold text-white">Create Project</h2>
          <button
            type="button"
            onClick={() => { onClose(); reset(); }}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Project Name *</label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => update('projectName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Tenant Migration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Owner</label>
              <input
                type="text"
                value={ownerSearch}
                onChange={(e) => handleOwnerSearch(e.target.value)}
                onFocus={() => ownerOptions.length === 0 && form.projectName && handleOwnerSearch(form.projectName.slice(0, 2))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Search user..."
              />
              {form.owner && (
                <p className="mt-1 text-sm text-slate-400">
                  Owner: {form.owner.displayName}
                  <button type="button" onClick={() => update('owner', null)} className="ml-2 text-red-400">Clear</button>
                </p>
              )}
              {ownerOptions.length > 0 && (
                <ul className="mt-1 border border-slate-600 rounded-lg overflow-hidden">
                  {ownerOptions.map((u, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => { update('owner', u); setOwnerOptions([]); setOwnerSearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
                      >
                        {u.displayName} ({u.userPrincipalName})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Assigned To</label>
              <input
                type="text"
                value={assignedSearch}
                onChange={(e) => handleAssignedSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Search and add users..."
              />
              {form.assignedTo.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.assignedTo.map((u, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-600 text-slate-200 text-sm"
                    >
                      {u.displayName}
                      <button type="button" onClick={() => removeAssigned(i)} className="text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
              {assignedOptions.length > 0 && (
                <ul className="mt-1 border border-slate-600 rounded-lg overflow-hidden">
                  {assignedOptions.map((u, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => addAssigned(u)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-600"
                      >
                        {u.displayName} ({u.userPrincipalName})
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => update('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => update('dueDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                placeholder="Brief description..."
              />
            </div>
            <div>
              <TaskChecklist tasks={form.tasks} onChange={(t) => update('tasks', t)} />
            </div>
          </div>
          <div className="p-4 border-t border-slate-600 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { onClose(); reset(); }}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.projectName.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
