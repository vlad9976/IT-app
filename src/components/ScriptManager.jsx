import React, { useState } from 'react';
import { FolderOpen, Plus, FileCode, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { isSectionedCategory } from '../utils/scriptStructure';

function toCategoryKey(displayName) {
  return displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function toScriptId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function getScriptList(data, cat) {
  const val = data[cat];
  if (Array.isArray(val)) return val;
  if (isSectionedCategory(val)) return Object.values(val).flat();
  return [];
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
    section: '',
    name: '',
    description: '',
    type: 'powershell',
    inputs: [],
    template: ''
  });

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
    setNewScript(prev => ({
      ...prev,
      inputs: [...prev.inputs, { variable: '', label: '', type: 'text', placeholder: '', defaultValue: '' }]
    }));
  };

  const handleUpdateInput = (idx, field, value) => {
    setNewScript(prev => {
      const next = [...prev.inputs];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'variable' && !next[idx].label) next[idx].label = value;
      return { ...prev, inputs: next };
    });
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
    const isSectioned = isSectionedCategory(data[cat]);
    if (isSectioned && !newScript.section) {
      setMessage('Select a subfolder for this category');
      return;
    }
    if (!newScript.name.trim()) {
      setMessage('Script name is required');
      return;
    }
    const id = editingScript ? editingScript.script.id : toScriptId(newScript.name);
    const validInputs = (newScript.inputs || [])
      .filter(inp => inp.variable?.trim())
      .map(inp => ({
        variable: inp.variable.trim(),
        label: (inp.label || inp.variable).trim(),
        type: inp.type || 'text',
        placeholder: (inp.placeholder || '').trim(),
        defaultValue: (inp.defaultValue || '').trim()
      }));
    const script = {
      id,
      name: newScript.name.trim(),
      description: (newScript.description || '').trim(),
      type: newScript.type || 'powershell',
      inputs: validInputs,
      template: (newScript.template || '').trim()
    };

    const addToSection = (d, category, sect, s) => {
      const copy = { ...d };
      const catData = { ...copy[category] };
      catData[sect] = [...(catData[sect] || []), s];
      copy[category] = catData;
      return copy;
    };

    const removeFromSection = (d, category, sect, scriptId) => {
      const copy = { ...d };
      const catData = { ...copy[category] };
      catData[sect] = (catData[sect] || []).filter(x => x.id !== scriptId);
      copy[category] = catData;
      return copy;
    };

    let updated;
    if (editingScript) {
      const { category: oldCat, section: oldSection, script: oldScript } = editingScript;
      const oldSectioned = isSectionedCategory(data[oldCat]);
      const targetSection = isSectioned ? newScript.section : null;

      if (oldSectioned) {
        updated = removeFromSection(data, oldCat, oldSection, oldScript.id);
      } else {
        updated = { ...data, [oldCat]: (data[oldCat] || []).filter(s => s.id !== oldScript.id) };
      }

      if (isSectioned) {
        updated = addToSection(updated, cat, targetSection, script);
      } else {
        updated = { ...updated, [cat]: [...(updated[cat] || []), script] };
      }
      setMessage('Script updated');
    } else {
      if (isSectioned) {
        updated = addToSection(data, cat, newScript.section, script);
      } else {
        updated = { ...data, [cat]: [...(data[cat] || []), script] };
      }
      setMessage('Script added');
    }
    setData(updated);
    setEditingScript(null);
    setNewScript({ category: cat, section: '', name: '', description: '', type: 'powershell', inputs: [], template: '' });
    setShowAddScript(false);
    setExpandedCategory(cat);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEditScript = (catKey, script, section = null) => {
    setEditingScript({ category: catKey, section, script });
    setNewScript({
      category: catKey,
      section: section || '',
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

  const handleDeleteScript = (catKey, scriptId, section = null) => {
    if (!confirm('Delete this script?')) return;
    const val = data[catKey];
    if (isSectionedCategory(val) && section) {
      const copy = { ...data };
      copy[catKey] = { ...val, [section]: (val[section] || []).filter(s => s.id !== scriptId) };
      setData(copy);
    } else {
      const list = (data[catKey] || []).filter(s => s.id !== scriptId);
      setData({ ...data, [catKey]: list });
    }
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
                  <span className="text-xs text-gray-500">{getScriptList(data, cat).length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/50 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expandedCategory === cat && (
                  isSectionedCategory(data[cat]) ? (
                    Object.entries(data[cat]).map(([secName, scripts]) =>
                      (scripts || []).map(script => (
                        <div
                          key={script.id}
                          onClick={() => handleEditScript(cat, script, secName)}
                          className={`flex items-center gap-2 pl-10 pr-3 py-1.5 hover:bg-dark-hover group cursor-pointer ${editingScript?.script?.id === script.id ? 'bg-blue-900/30' : ''}`}
                        >
                          <FileCode className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 w-20 truncate">{secName}</span>
                          <span className="text-sm text-gray-300 flex-1 truncate">{script.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteScript(cat, script.id, secName); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/50 text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ).flat()
                  ) : (
                    (data[cat] || []).map(script => (
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
                    ))
                  )
                )}
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
                    onChange={(e) => setNewScript(prev => ({ ...prev, category: e.target.value, section: '' }))}
                    className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white"
                  >
                    <option value="">Select folder</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                {newScript.category && isSectionedCategory(data[newScript.category]) && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Subfolder</label>
                    <select
                      value={newScript.section}
                      onChange={(e) => setNewScript(prev => ({ ...prev, section: e.target.value }))}
                      className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-white"
                    >
                      <option value="">Select subfolder</option>
                      {Object.keys(data[newScript.category] || {}).map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                )}
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Parameters</label>
                    <p className="text-xs text-gray-500 mt-0.5">Use {'{{variable}}'} in your script for each parameter</p>
                  </div>
                  <button
                    onClick={handleAddInput}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add Parameter
                  </button>
                </div>
                {newScript.inputs.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center bg-dark-surface/50 rounded-lg border border-dashed border-dark-border">
                    No parameters — click Add Parameter to create one
                  </p>
                ) : (
                  <div className="space-y-3">
                    {newScript.inputs.map((inp, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-dark-surface rounded-lg border border-dark-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-400">Parameter {idx + 1}</span>
                          <button
                            onClick={() => handleRemoveInput(idx)}
                            className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Variable name *</label>
                            <input
                              type="text"
                              value={inp.variable}
                              onChange={(e) => handleUpdateInput(idx, 'variable', e.target.value)}
                              placeholder="e.g. username"
                              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Label</label>
                            <input
                              type="text"
                              value={inp.label}
                              onChange={(e) => handleUpdateInput(idx, 'label', e.target.value)}
                              placeholder="e.g. Username"
                              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <select
                              value={inp.type || 'text'}
                              onChange={(e) => handleUpdateInput(idx, 'type', e.target.value)}
                              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white"
                            >
                              <option value="text">Text</option>
                              <option value="password">Password</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Placeholder</label>
                            <input
                              type="text"
                              value={inp.placeholder || ''}
                              onChange={(e) => handleUpdateInput(idx, 'placeholder', e.target.value)}
                              placeholder="optional"
                              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Default value</label>
                          <input
                            type="text"
                            value={inp.defaultValue || ''}
                            onChange={(e) => handleUpdateInput(idx, 'defaultValue', e.target.value)}
                            placeholder="optional"
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
