import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ScriptPanel from './components/ScriptPanel';
import scriptsData from './data/scripts.json';

function App() {
  const [selectedScript, setSelectedScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = Object.keys(scriptsData);

  const handleScriptSelect = (category, scriptId) => {
    setSelectedCategory(category);
    const script = scriptsData[category].find(s => s.id === scriptId);
    setSelectedScript(script);
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      <Sidebar 
        categories={categories}
        scriptsData={scriptsData}
        onScriptSelect={handleScriptSelect}
        selectedScript={selectedScript}
      />
      <ScriptPanel 
        script={selectedScript}
      />
    </div>
  );
}

export default App;
