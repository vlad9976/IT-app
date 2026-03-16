import React from 'react';
import { FolderKanban, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function ProjectDashboard({ projects = [], recentActivity = [] }) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'In Progress').length;
  const blocked = projects.filter((p) => p.status === 'Blocked').length;
  const completed = projects.filter((p) => p.status === 'Completed').length;

  const cards = [
    { label: 'Total Projects', value: total, icon: FolderKanban, color: 'bg-slate-700 border-slate-600' },
    { label: 'Active', value: active, icon: Play, color: 'bg-blue-900/40 border-blue-700' },
    { label: 'Blocked', value: blocked, icon: AlertCircle, color: 'bg-amber-900/40 border-amber-700' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'bg-emerald-900/40 border-emerald-700' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{label}</span>
              <Icon className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" /> Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent activity. Open a project to see updates.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.slice(0, 15).map((a, i) => (
              <li key={i} className="text-sm text-slate-300 flex justify-between gap-2">
                <span>{a.action}</span>
                <span className="text-slate-500 shrink-0">{a.at ? new Date(a.at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
