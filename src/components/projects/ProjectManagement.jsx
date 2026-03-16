import React, { useState, useEffect, useCallback } from 'react';
import { FolderKanban, LayoutDashboard, List, Plus, Cloud, Loader2 } from 'lucide-react';
import { useToast } from '../m365/useToast';
import { ToastContainer } from '../m365/Toast';
import ProjectDashboard from './ProjectDashboard';
import ProjectList from './ProjectList';
import ProjectDetails from './ProjectDetails';
import CreateProjectModal from './CreateProjectModal';

export default function ProjectManagement({ projectContext, setProjectContext }) {
  const { toasts, removeToast, success, error: showError } = useToast();
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({ status: null, priority: null, owner: null, assignedTo: null });
  const [loadError, setLoadError] = useState(null);

  const siteId = projectContext?.siteId ?? null;
  const listId = projectContext?.listId ?? null;

  const checkAuth = useCallback(async () => {
    if (window.electron?.m365?.getAuthStatus) {
      const status = await window.electron.m365.getAuthStatus();
      setAuthStatus(status);
      return status.authenticated;
    }
    return false;
  }, []);

  const loadProjects = useCallback(async () => {
    if (!window.electron?.projects?.getAll) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await window.electron.projects.getAll({ top: 200 });
      if (result.success && Array.isArray(result.items)) {
        setProjects(result.items);
        if (!projectContext?.siteId || !projectContext?.listId) {
          const siteRes = await window.electron.projects.getSiteRoot();
          const listRes = siteRes.success && await window.electron.projects.getListId(siteRes.site?.id);
          if (siteRes.success && listRes?.success) {
            setProjectContext?.({ siteId: siteRes.site?.id, listId: listRes.listId });
          }
        }
      } else if (!result.success && result.error) {
        const msg = result.error.message || 'Failed to load projects';
        const code = result.error.code || '';
        showError(msg);
        if (code === 'ACCESS_DENIED' || code === 'LIST_NOT_FOUND' || code === 'LIST_CREATE_DENIED' || /access denied|permission|403/i.test(msg)) {
          setLoadError({ message: msg, code });
        }
      }
    } catch (err) {
      const msg = err?.message || 'Failed to load projects';
      showError(msg);
      if (/access denied|permission|403/i.test(msg)) setLoadError({ message: msg });
    } finally {
      setLoading(false);
    }
  }, [projectContext?.siteId, projectContext?.listId, setProjectContext, showError]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authStatus.authenticated) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [authStatus.authenticated, loadProjects]);

  const handleCreated = () => {
    loadProjects();
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setView('list');
  };

  const handleUpdated = (updated) => {
    if (updated) {
      setSelectedProject((prev) => (prev && prev.id === updated.id ? updated : prev));
    }
    loadProjects();
  };

  const handleDeleted = () => {
    setSelectedProject(null);
    setView('list');
    loadProjects();
  };

  const recentActivity = projects.flatMap((p) => (p.activity || []).map((a) => ({ ...a, projectName: p.projectName }))).sort((a, b) => new Date(b.at) - new Date(a.at));

  if (!authStatus.authenticated) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-full text-center p-8">
          <Cloud className="w-16 h-16 text-slate-500 mb-4" />
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Connect to Microsoft 365</h2>
          <p className="text-slate-400 max-w-md mb-4">
            Project Management syncs with SharePoint using your Microsoft 365 account. Connect in the Microsoft 365 section first, then return here.
          </p>
          <p className="text-slate-500 text-sm">Go to Microsoft 365 in the sidebar and sign in with device code.</p>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <div className="flex flex-col h-full bg-dark-bg">
          <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-3 shrink-0">
            <FolderKanban className="w-8 h-8 text-emerald-500" />
            <div>
              <h1 className="text-lg font-semibold text-white">Project Management</h1>
              <p className="text-sm text-slate-400">SharePoint · IT Team</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 max-w-2xl">
            <div className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-amber-200">Setup required</h2>
              <p className="text-slate-300 text-sm">{loadError.message}</p>
              <div className="text-sm text-slate-400 space-y-3">
                <p className="font-medium text-slate-300">What to do:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Azure Portal</strong> → Your app registration → API permissions → Add permission → Microsoft Graph → Delegated → add <code className="bg-slate-800 px-1 rounded">Sites.ReadWrite.All</code> and <code className="bg-slate-800 px-1 rounded">Sites.Manage.All</code> → Grant admin consent.</li>
                  <li>Disconnect and reconnect in this app (Microsoft 365 section) so the new permissions are used.</li>
                  <li>Your account must have access to the SharePoint site (e.g. root site).</li>
                  <li><strong>Or create the list manually:</strong> Open your SharePoint root site → Site contents → New → List → Blank → name it exactly <strong>ITProjects</strong>. Add columns: ProjectName (text), Owner (text), AssignedTo (text), Status (Choice: Planned, In Progress, Blocked, Completed), Priority (Choice: Low, Medium, High, Critical), StartDate, DueDate (Date), Progress (Number), Description, Tasks, Notes, ActivityLog (text), CreatedDate, LastUpdated (Date/Time).</li>
                </ol>
              </div>
              <button
                type="button"
                onClick={() => { setLoadError(null); loadProjects(); }}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-dark-bg w-full">
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-emerald-500" />
            <div>
              <h1 className="text-lg font-semibold text-white">Project Management</h1>
              <p className="text-sm text-slate-400">SharePoint · IT Team</p>
            </div>
          </div>
          {view !== 'detail' && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          )}
        </div>

        {view === 'detail' && selectedProject ? (
          <div className="flex-1 overflow-auto p-6 lg:px-10">
            <ProjectDetails
              project={selectedProject}
              siteId={siteId}
              listId={listId}
              loading={false}
              onBack={handleBackToList}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          </div>
        ) : (
          <>
            <nav className="flex gap-1 px-6 pt-4 border-b border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  view === 'dashboard' ? 'bg-slate-800 text-white border border-slate-600 border-b-0' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-slate-800 text-white border border-slate-600 border-b-0' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" /> Project List
              </button>
            </nav>
            <div className="flex-1 overflow-auto p-6 lg:px-10">
              {view === 'dashboard' && (
                <ProjectDashboard projects={projects} recentActivity={recentActivity} />
              )}
              {view === 'list' && (
                <ProjectList
                  projects={projects}
                  loading={loading}
                  onSelect={handleSelectProject}
                  onExportCSV={async (csv) => {
                    if (window.electron?.saveFileDialog) {
                      await window.electron.saveFileDialog(`ITProjects_${new Date().toISOString().slice(0, 10)}.csv`, csv);
                      success('CSV exported');
                    }
                  }}
                  filterStatus={filters.status}
                  filterPriority={filters.priority}
                  filterOwner={filters.owner}
                  filterAssignedTo={filters.assignedTo}
                  onFilterStatus={(v) => setFilters((f) => ({ ...f, status: v }))}
                  onFilterPriority={(v) => setFilters((f) => ({ ...f, priority: v }))}
                  onFilterOwner={(v) => setFilters((f) => ({ ...f, owner: v }))}
                  onFilterAssignedTo={(v) => setFilters((f) => ({ ...f, assignedTo: v }))}
                />
              )}
            </div>
          </>
        )}
      </div>

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}
