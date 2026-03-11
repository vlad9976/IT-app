import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ScriptPanel from './components/ScriptPanel';
import ScriptManager from './components/ScriptManager';
import UpdateNotification from './components/UpdateNotification';
import M365Dashboard from './components/M365DashboardNew';
import ErrorBoundary from './components/ErrorBoundary';
import { findScriptInCategory, isSectionedCategory } from './utils/scriptStructure';

// Fallback when not in Electron (e.g. Vite dev without Electron)
const defaultScripts = { active_directory: { "User Scripts": [], "Group Scripts": [], "System": [] }, local_machine: [], troubleshooting: [] };

function App() {
  const [scriptsData, setScriptsData] = useState(defaultScripts);
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('scripts');
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleScriptsSaved = (data) => {
    if (data) setScriptsData(data);
    setShowScriptManager(false);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-dark-bg">
        <Sidebar
          categories={categories}
          scriptsData={scriptsData}
          onScriptSelect={handleScriptSelect}
          onM365Select={handleM365Select}
          onManageScripts={() => setShowScriptManager(true)}
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
            <ScriptPanel script={selectedScript} />
          ) : (
            <M365Dashboard />
          )}
        </div>
        <UpdateNotification />
      </div>
    </ErrorBoundary>
  );
}

export default App;
