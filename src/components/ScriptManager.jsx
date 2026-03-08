import React, { useState } from 'react';
import { FolderOpen, Plus, FileCode, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

function toCategoryKey(displayName) {
  return displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function toScriptId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const ScriptManager = ({ scriptsData, onSave, onClose }) => {
  const [categories, setCategories] = useState(() => Object.keys(scriptsData || {}));
  const [data, setData] = useState(() => ({ ...scriptsData }) || {});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddScript, setShowAddScript] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Add Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  // Add Script form
  const [newScript, setNewScript] = useState({
    category: '',
    name: '',
    description: '',
    type: 'powershell',
    inputs: [],
    template: ''
  });
  const [newInput, setNewInput] = useState({ variable: '', label: '', type: 'text', placeholder: '', defaultValue: '' });

  const handleAddCategory = () => {
    const key = toCategoryKey(newCategoryName);
    if (!key) return;
    if (data[key]) {
      setMessage('Category already exists');
      return;
    }
    const updated = { ...data, [key]: [] };
    setData(updated);
    setCategories(Object.keys(updated));
    setNewCategoryName('');
    setShowAddCategory(false);
    setExpandedCategory(key);
    setMessage('Category added');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleAddInput = () => {
    if (!newInput.variable.trim()) return;
    const inp = {
      variable: newInput.variable.trim(),
      label: newInput.label || newInput.variable,
      type: newInput.type || 'text',
      placeholder: newInput.placeholder || '',
      defaultValue: newInput.defaultValue || ''
    };
    setNewScript(prev => ({ ...prev, inputs: [...prev.inputs, inp] }));
    setNewInput({ variable: '', label: '', type: 'text', placeholder: '', defaultValue: '' });
  };

  const handleRemoveInput = (idx) => {
    setNewScript(prev => ({ ...prev, inputs: prev.inputs.filter((_, i) => i !== idx) }));
  };

  const handleAddOrUpdateScript = () => {
    const cat = newScript.category || selectedCategory;
    if (!cat || !data[cat]) {
      setMessage('Select or create a category first');
      return;
    }
    if (!newScript.name.trim()) {
      setMessage('Script name is required');
      return;
    }
    const id = editingScript ? editingScript.script.id : toScriptId(newScript.name);
    const script = {
      id,
      name: newScript.name.trim(),
      description: (newScript.description || '').trim(),
      type: newScript.type || 'powershell',
      inputs: [...(newScript.inputs || [])],
      template: (newScript.template || '').trim()
    };
    let updated;
    if (editingScript) {
      const { category: oldCat, script: oldScript } = editingScript;
      const list = (data[oldCat] || []).filter(s => s.id !== oldScript.id);
      if (oldCat === cat) {
        updated = { ...data, [cat]: [...list, script] };
      } else {
        updated = { ...data, [oldCat]: list, [cat]: [...(data[cat] || []), script] };
      }
      setMessage('Script updated');
    } else {
      updated = { ...data, [cat]: [...(data[cat] || []), script] };
      setMessage('Script added');
    }
    setData(updated);
    setEditingScript(null);
    setNewScript({ category: cat, name: '', description: '', type: 'powershell', inputs: [], template: '' });
    setShowAddScript(false);
    setExpandedCategory(cat);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEditScript = (catKey, script) => {
    setEditingScript({ category: catKey, script });
    setNewScript({
      category: catKey,
      name: script.name || '',
      description: script.description || '',
      type: script.type || 'powershell',
      inputs: [...(script.inputs || [])],
      template: script.template || ''
    });
    setShowAddScript(true);
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (key) => {
    if (!confirm(`Delete category "${key.replace(/_/g, ' ')}" and all its scripts?`)) return;
    const { [key]: _, ...rest } = data;
    setData(rest);
    setCategories(Object.keys(rest));
  };

  const handleDeleteScript = (catKey, scriptId) => {
    if (!confirm('Delete this script?')) return;
    const list = (data[catKey] || []).filter(s => s.id !== scriptId);
    setData({ ...data, [catKey]: list });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (window.electron?.saveScriptsData) {
        const result = await window.electron.saveScriptsData(data);
        if (result?.success) {
          setMessage('Saved successfully');
          onSave?.(data);
        } else {
          setMessage('Save failed: ' + (result?.error || 'Unknown error'));
        }
      } else {
        setMessage('Save not available (run in Electron)');
      }
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark-border bg-dark-surface">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-xl font-bold text-white">Manage Scripts</h2>
            <p className="text-sm text-gray-400">Add, edit, and remove folders and scripts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-sm text-gray-400">{message}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            Done
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Categories & Scripts tree */}
        <div className="w-80 border-r border-dark-border flex flex-col bg-dark-surface">
          <div className="p-3 border-b border-dark-border flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Folders & Scripts</span>
            <div className="flex gap-1">
              <button
                onClick={() => { setShowAddCategory(true); setShowAddScript(false); }}
                className="p-1.5 rounded hover:bg-dark-hover text-gray-400 hover:text-white"
                title="Add folder"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditingScript(null);
                  setShowAddScript(true);
                  setShowAddCategory(false);
                  setNewScript({ category: selectedCategory || categories[0], name: '', description: '', type: 'powershell', inputs: [], template: '' });
                }}
                className="p-1.5 rounded hover:bg-dark-hover text-gray-400 hover:text-white"
                title="Add script"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {categories.map(cat => (
              <div key={cat}>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-hover group cursor-pointer"
                  onClick={() => {
                    setExpandedCategory(prev => prev === cat ? null : cat);
                    setSelectedCategory(cat);
                  }}
                >
                  {expandedCategory === cat ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-200 flex-1 capitalize">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{(data[cat] || []).length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/50 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedCategory === cat && (data[cat] || []).map(script => (
                  <div
                    key={script.id}
                    onClick={() => handleEditScript(cat, script)}
                    className={`flex items-center gap-2 pl-10 pr-3 py-1.5 hover:bg-dark-hover group cursor-pointer ${editingScript?.script?.id === script.id ? 'bg-blue-900/30' : ''}`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-300 flex-1 truncate">{script.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteScript(cat, script.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/50 text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Add form */}
        <div className="flex-1 overflow-y-auto p-6 bg-dark-bg">
          {showAddCategory && (
            <div className="max-w-md space-y-4">
              <h3 className="text-lg font-semibold text-white">Add Folder (Category)</h3>
              <p className="text-sm text-gray-400">Creates a new folder in the sidebar, e.g. &quot;Domain Migration&quot; → domain_migration</p>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Domain Migration"
                className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Add Folder
                </button>
                <button onClick={() => setShowAddCategory(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showAddScript && (
            <div className="max-w-2xl space-y-6">
              <h3 className="text-lg font-semibold text-white">{editingScript ? 'Edit Script' : 'Add Script'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Folder</label>
                  <select
                    value={newScript.category}
                    onChange={(e) => setNewScript(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white"
                  >
                    <option value="">Select folder</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select
                    value={newScript.type}
                    onChange={(e) => setNewScript(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white"
                  >
                    <option value="powershell">PowerShell</option>
                    <option value="cmd">CMD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newScript.name}
                  onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Reset AD Password"
                  className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newScript.description}
                  onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this script do?"
                  className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Inputs (use {'{{variable}}'} in template)</label>
                <div className="space-y-2 mb-2">
                  {newScript.inputs.map((inp, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-dark-surface px-2 py-1 rounded text-gray-300">
                        {inp.variable} ({inp.type})
                      </span>
                      <button onClick={() => handleRemoveInput(idx)} className="text-red-400 hover:text-red-300 text-xs">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={newInput.variable}
                    onChange={(e) => setNewInput(prev => ({ ...prev, variable: e.target.value }))}
                    placeholder="variable"
                    className="w-24 px-2 py-1.5 bg-dark-surface border border-dark-border rounded text-sm text-white"
                  />
                  <input
                    type="text"
                    value={newInput.label}
                    onChange={(e) => setNewInput(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="label"
                    className="w-24 px-2 py-1.5 bg-dark-surface border border-dark-border rounded text-sm text-white"
                  />
                  <select
                    value={newInput.type}
                    onChange={(e) => setNewInput(prev => ({ ...prev, type: e.target.value }))}
                    className="px-2 py-1.5 bg-dark-surface border border-dark-border rounded text-sm text-white"
                  >
                    <option value="text">text</option>
                    <option value="password">password</option>
                  </select>
                  <input
                    type="text"
                    value={newInput.placeholder}
                    onChange={(e) => setNewInput(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="placeholder"
                    className="w-28 px-2 py-1.5 bg-dark-surface border border-dark-border rounded text-sm text-white"
                  />
                  <button onClick={handleAddInput} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                    Add Input
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Script Template</label>
                <p className="text-xs text-gray-500 mb-1">Use {`{{variable}}`} for each input</p>
                <textarea
                  value={newScript.template}
                  onChange={(e) => setNewScript(prev => ({ ...prev, template: e.target.value }))}
                  placeholder="# Your script here"
                  rows={12}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-gray-200 font-mono text-sm placeholder-gray-500 resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddOrUpdateScript} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {editingScript ? 'Save Changes' : 'Add Script'}
                </button>
                <button onClick={() => { setShowAddScript(false); setEditingScript(null); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showAddCategory && !showAddScript && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2">Add or edit folders and scripts</p>
              <p className="text-sm text-gray-500">Use the buttons to add, or click a script to edit it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptManager;
