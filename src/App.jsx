import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ScriptPanel from './components/ScriptPanel';
import UpdateNotification from './components/UpdateNotification';
import M365Dashboard from './components/M365DashboardNew';
import ErrorBoundary from './components/ErrorBoundary';
import scriptsData from './data/scripts.json';

function App() {
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('scripts');

  const categories = Object.keys(scriptsData);

  const handleScriptSelect = (category, scriptId) => {
    setSelectedCategory(category);
    const script = scriptsData[category].find(s => s.id === scriptId);
    setSelectedScript(script);
    setViewMode('scripts');
  };

  const handleM365Select = () => {
    setViewMode('m365');
    setSelectedScript(null);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-dark-bg">
        <Sidebar 
          categories={categories}
          scriptsData={scriptsData}
          onScriptSelect={handleScriptSelect}
          onM365Select={handleM365Select}
          selectedScript={selectedScript}
          viewMode={viewMode}
        />
        <div className="flex-1 min-w-0 flex overflow-hidden">
          {viewMode === 'scripts' ? (
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
