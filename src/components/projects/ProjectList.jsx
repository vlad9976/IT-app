import React, { useMemo, useState } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import { projectsToCSV } from './projectUtils';

const STATUS_OPTIONS = ['', 'Planned', 'In Progress', 'Blocked', 'Completed'];
const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High', 'Critical'];

export default function ProjectList({
  projects = [],
  loading,
  onSelect,
  onExportCSV,
  filterStatus,
  filterPriority,
  filterOwner,
  filterAssignedTo,
  onFilterStatus,
  onFilterPriority,
  onFilterOwner,
  onFilterAssignedTo
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.projectName || '').toLowerCase().includes(q) ||
          String(p.owner || '').toLowerCase().includes(q) ||
          String(p.assignedTo || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    if (filterPriority) list = list.filter((p) => p.priority === filterPriority);
    // Owner / AssignedTo are stored as plain text labels now
    return list;
  }, [projects, search, filterStatus, filterPriority, filterOwner, filterAssignedTo]);

  const handleExport = async () => {
    const csv = projectsToCSV(filtered);
    if (onExportCSV) {
      onExportCSV(csv);
    } else if (window.electron?.saveFileDialog) {
      await window.electron.saveFileDialog(`ITProjects_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterStatus || ''}
          onChange={(e) => onFilterStatus?.(e.target.value || null)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterPriority || ''}
          onChange={(e) => onFilterPriority?.(e.target.value || null)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-200 text-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="rounded-xl border border-slate-600 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Project Name</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => onSelect?.(p)}
                    className="border-t border-slate-700 hover:bg-slate-700/50 cursor-pointer text-slate-200"
                  >
                    <td className="px-4 py-3 font-medium">{p.projectName || '—'}</td>
                    <td className="px-4 py-3">{p.owner || '—'}</td>
                    <td className="px-4 py-3">
                      {String(p.assignedTo || '').split('\n').filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">{p.status || '—'}</td>
                    <td className="px-4 py-3">{p.priority || '—'}</td>
                    <td className="px-4 py-3">{p.progress != null ? `${p.progress}%` : '—'}</td>
                    <td className="px-4 py-3">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-slate-500">No projects match the filters.</div>
        )}
      </div>
    </div>
  );
}
