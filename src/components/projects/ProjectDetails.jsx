import React, { useState, useCallback } from 'react';
import { ArrowLeft, Loader2, Edit2, Trash2, Save } from 'lucide-react';
import TaskChecklist from './TaskChecklist';
import ProjectNotes from './ProjectNotes';
import { useToast } from '../m365/useToast';
import { appendActivity, progressFromTasks } from './projectUtils';

const STATUS_OPTIONS = ['Planned', 'In Progress', 'Blocked', 'Completed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

export default function ProjectDetails({
  project,
  siteId,
  listId,
  loading,
  onBack,
  onDeleted,
  onUpdated
}) {
  const { success, error: showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(null);

  const data = local || project;
  const isEditing = editing && local;

  const updateLocal = useCallback((updates) => {
    setLocal((prev) => ({ ...(prev || project), ...updates }));
  }, [project]);

  const save = useCallback(async (updates) => {
    if (!window.electron?.projects?.update || !project?.id) return;
    setSaving(true);
    try {
      const result = await window.electron.projects.update(siteId, listId, project.id, updates);
      if (result.success) {
        success('Project updated');
        setLocal(null);
        setEditing(false);
        onUpdated?.(result.item);
      } else {
        showError(result?.error?.message || 'Update failed');
      }
    } catch (err) {
      showError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }, [siteId, listId, project?.id, onUpdated]);

  const handleSaveAll = () => {
    if (!local) return;
    save({
      projectName: local.projectName,
      status: local.status,
      priority: local.priority,
      startDate: local.startDate,
      dueDate: local.dueDate,
      description: local.description,
      progress: local.progress,
      tasks: local.tasks,
      notes: local.notes,
      activity: local.activity
    });
  };

  const handleTasksChange = (nextTasks) => {
    const progress = progressFromTasks(nextTasks);
    const activity = appendActivity(data?.activity, 'Task checklist updated', 'Current User', { progress });
    if (editing) {
      updateLocal({ tasks: nextTasks, progress, activity });
    } else {
      save({ tasks: nextTasks, progress, activity });
    }
  };

  const handleAddNote = (note) => {
    const notes = [...(data?.notes || []), note];
    const activity = appendActivity(data?.activity, 'Note added', note.author);
    if (editing) {
      updateLocal({ notes, activity });
    } else {
      save({ notes, activity });
    }
  };

  const handleStatusChange = (newStatus) => {
    const activity = appendActivity(data?.activity, `Status changed to ${newStatus}`, 'Current User');
    if (editing) {
      updateLocal({ status: newStatus, activity });
    } else {
      save({ status: newStatus, activity });
    }
  };

  const handleProgressChange = (newProgress) => {
    if (editing) {
      updateLocal({ progress: newProgress });
    } else {
      save({ progress: newProgress });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    if (!window.electron?.projects?.delete) return;
    setSaving(true);
    try {
      const result = await window.electron.projects.delete(siteId, listId, project.id);
      if (result.success) {
        success('Project deleted');
        onDeleted?.();
      } else {
        showError(result?.error?.message || 'Delete failed');
      }
    } catch (err) {
      showError(err?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => { setLocal({ ...project }); setEditing(true); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setLocal(null); setEditing(false); }}
                className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-400"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          <div className="w-full rounded-xl border border-slate-600 bg-slate-800/50 p-6 space-y-4">
            <h1 className="text-xl font-semibold text-white">
              {isEditing ? (
                <input
                  type="text"
                  value={data.projectName}
                  onChange={(e) => updateLocal({ projectName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                />
              ) : (
                data.projectName
              )}
            </h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Owner</span>
                <p className="text-slate-200">{data.owner?.displayName || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Assigned To</span>
                <p className="text-slate-200">
                  {(data.assignedTo || []).map((u) => u.displayName).join(', ') || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                {isEditing ? (
                  <select
                    value={data.status}
                    onChange={(e) => updateLocal({ status: e.target.value })}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded text-slate-200"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-200">
                    {data.status}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(data.status === 'In Progress' ? 'Blocked' : 'In Progress')}
                      className="ml-2 text-xs text-emerald-400 hover:underline"
                    >
                      Change
                    </button>
                  </p>
                )}
              </div>
              <div>
                <span className="text-slate-500">Priority</span>
                {isEditing ? (
                  <select
                    value={data.priority}
                    onChange={(e) => updateLocal({ priority: e.target.value })}
                    className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded text-slate-200"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-200">{data.priority}</p>
                )}
              </div>
              <div>
                <span className="text-slate-500">Progress</span>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={data.progress ?? 0}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 block w-24 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                  />
                ) : (
                  <p className="text-slate-200">{data.progress != null ? `${data.progress}%` : '0%'}</p>
                )}
              </div>
              <div>
                <span className="text-slate-500">Start / Due</span>
                <p className="text-slate-200">
                  {data.startDate ? new Date(data.startDate).toLocaleDateString() : '—'} /{' '}
                  {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
            {data.description && (
              <div>
                <span className="text-slate-500 text-sm">Description</span>
                {isEditing ? (
                  <textarea
                    value={data.description}
                    onChange={(e) => updateLocal({ description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
                  />
                ) : (
                  <p className="text-slate-300 mt-1 whitespace-pre-wrap">{data.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
              <TaskChecklist
                tasks={data.tasks}
                onChange={handleTasksChange}
                readOnly={false}
              />
            </div>
            <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
              <ProjectNotes notes={data.notes} onAdd={handleAddNote} readOnly={false} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Activity</h3>
            <ul className="space-y-1 text-sm text-slate-400">
              {(data.activity || []).slice(0, 20).map((a, i) => (
                <li key={i}>
                  {a.action} — {a.by} · {a.at ? new Date(a.at).toLocaleString() : ''}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
