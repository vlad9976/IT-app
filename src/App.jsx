import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ScriptPanel from './components/ScriptPanel';
import ScriptManager from './components/ScriptManager';
import UpdateNotification from './components/UpdateNotification';
import M365Dashboard from './components/M365DashboardNew';
import ProjectManagement from './components/projects/ProjectManagement';
import ErrorBoundary from './components/ErrorBoundary';
import EventDocsModal from './components/EventDocsModal';
import ServiceDocsModal from './components/ServiceDocsModal';
import PortDocsModal from './components/PortDocsModal';
import M365LicenseDocsModal from './components/M365LicenseDocsModal';
import BackupDocsModal from './components/BackupDocsModal';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { findScriptInCategory, isSectionedCategory } from './utils/scriptStructure';

// Fallback when not in Electron (e.g. Vite dev without Electron)
const defaultScripts = { active_directory: { "User Scripts": [], "Group Scripts": [], "System": [] }, local_machine: [], troubleshooting: [] };

function App() {
  const [scriptsData, setScriptsData] = useState(defaultScripts);
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('scripts');
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [projectContext, setProjectContext] = useState({ siteId: null, listId: null });
  const [loading, setLoading] = useState(true);
  const [openDoc, setOpenDoc] = useState(null); // 'event'|'service'|'port'|'m365'|'backup'

  useEffect(() => {
    async function loadScripts() {
      if (window.electron?.getScriptsData) {
        try {
          const data = await window.electron.getScriptsData();
          if (data && Object.keys(data).length > 0) {
            setScriptsData(data);
          } else {
            const mod = await import('./data/scripts.json');
            setScriptsData(mod.default || defaultScripts);
          }
        } catch {
          const mod = await import('./data/scripts.json');
          setScriptsData(mod.default || defaultScripts);
        }
      } else {
        const mod = await import('./data/scripts.json');
        setScriptsData(mod.default || defaultScripts);
      }
      setLoading(false);
    }
    loadScripts();
  }, []);

  const categories = Object.keys(scriptsData).filter(k =>
    Array.isArray(scriptsData[k]) || isSectionedCategory(scriptsData[k])
  );

  const handleScriptSelect = (category, scriptId) => {
    setSelectedCategory(category);
    const script = findScriptInCategory(scriptsData, category, scriptId);
    setSelectedScript(script || null);
    setViewMode('scripts');
  };

  const handleM365Select = () => {
    setViewMode('m365');
    setSelectedScript(null);
  };

  const handleProjectsSelect = () => {
    setViewMode('projects');
    setSelectedScript(null);
  };

  const handleScriptsSaved = (data) => {
    if (data) setScriptsData(data);
    setShowScriptManager(false);
  };

  return (
    <ErrorBoundary>
      <FavoritesProvider>
      <div className="flex h-screen bg-dark-bg">
        <Sidebar
          categories={categories}
          scriptsData={scriptsData}
          onScriptSelect={handleScriptSelect}
          onM365Select={handleM365Select}
          onProjectsSelect={handleProjectsSelect}
          onManageScripts={() => setShowScriptManager(true)}
          onOpenDoc={setOpenDoc}
          selectedScript={selectedScript}
          viewMode={viewMode}
          loading={loading}
        />
        <div className="flex-1 min-w-0 flex overflow-hidden">
          {showScriptManager ? (
            <ScriptManager
              scriptsData={scriptsData}
              onSave={handleScriptsSaved}
              onClose={() => setShowScriptManager(false)}
            />
          ) : viewMode === 'scripts' ? (
            <ScriptPanel script={selectedScript} onOpenDoc={setOpenDoc} />
          ) : viewMode === 'projects' ? (
            <ProjectManagement projectContext={projectContext} setProjectContext={setProjectContext} />
          ) : (
            <M365Dashboard />
          )}
        </div>
        <UpdateNotification />
        {/* Documentation modals - quick access from anywhere */}
        <EventDocsModal isOpen={openDoc === 'event'} onClose={() => setOpenDoc(null)} />
        <ServiceDocsModal isOpen={openDoc === 'service'} onClose={() => setOpenDoc(null)} />
        <PortDocsModal isOpen={openDoc === 'port'} onClose={() => setOpenDoc(null)} />
        <M365LicenseDocsModal isOpen={openDoc === 'm365'} onClose={() => setOpenDoc(null)} />
        <BackupDocsModal isOpen={openDoc === 'backup'} onClose={() => setOpenDoc(null)} />
      </div>
      </FavoritesProvider>
    </ErrorBoundary>
  );
}

export default App;
