/**
 * CSV export for project list.
 * Columns: Project Name, Owner, Assigned To, Status, Priority, Progress, Start Date, Due Date
 */
export function projectsToCSV(projects) {
  const header = [
    'Project Name',
    'Owner',
    'Assigned To',
    'Status',
    'Priority',
    'Progress',
    'Start Date',
    'Due Date'
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const row = (p) => [
    escape(p.projectName),
    escape(p.owner?.displayName ?? p.owner ?? ''),
    escape(Array.isArray(p.assignedTo) ? p.assignedTo.map((u) => u?.displayName ?? u).join('; ') : p.assignedTo ?? ''),
    escape(p.status),
    escape(p.priority),
    escape(p.progress != null ? p.progress : ''),
    escape(p.startDate ?? ''),
    escape(p.dueDate ?? '')
  ];
  const lines = [header.join(','), ...(projects || []).map(row)];
  return lines.join('\r\n');
}

/**
 * Activity log entries: { action, by, at, meta? }
 */
export function appendActivity(existing, action, by, meta = null) {
  const entries = Array.isArray(existing) ? [...existing] : [];
  entries.unshift({
    action,
    by: by || 'System',
    at: new Date().toISOString(),
    ...(meta && { meta })
  });
  return entries.slice(0, 100);
}

/**
 * Compute progress from tasks: completed / total, 0-100.
 */
export function progressFromTasks(tasks) {
  const t = tasks?.tasks ?? tasks;
  if (!Array.isArray(t) || t.length === 0) return 0;
  const completed = t.filter((x) => x.completed).length;
  return Math.round((completed / t.length) * 100);
}
