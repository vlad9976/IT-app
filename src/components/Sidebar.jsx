import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Terminal, FolderOpen, Search, X, Plug, Cloud, Settings, Star, BookOpen } from 'lucide-react';
import { getScriptsFromCategory, getCategoryStructure, isSectionedCategory, findScriptLocation } from '../utils/scriptStructure';
import { useFavorites } from '../contexts/FavoritesContext';

const DOCS = [
  { id: 'event', label: 'Event IDs', desc: 'Windows Event Log' },
  { id: 'service', label: 'Services', desc: 'Windows Services' },
  { id: 'port', label: 'Ports', desc: 'Common TCP/UDP ports' },
  { id: 'network', label: 'Network Concepts', desc: 'IP, DNS, VLAN, VPN and examples' },
  { id: 'm365', label: 'M365 Licenses', desc: 'Microsoft 365 SKUs' },
  { id: 'backup', label: 'Backup Guide', desc: 'Domain Migration' },
];

const Sidebar = ({ categories, scriptsData, onScriptSelect, onM365Select, onManageScripts, onOpenDoc, selectedScript, viewMode, loading }) => {
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const docsMenuRef = useRef(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const favoritedScripts = useMemo(() => {
    return favorites
      .map(id => findScriptLocation(scriptsData, id))
      .filter(Boolean);
  }, [favorites, scriptsData]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleSection = (category, sectionName) => {
    const key = `${category}::${sectionName}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryIcon = (category) => {
    return <FolderOpen className="w-4 h-4" />;
  };

  // Filter categories and scripts based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { categories, scriptsData };
    }

    const query = searchQuery.toLowerCase();
    const filtered = {};

    categories.forEach(category => {
      const scripts = getScriptsFromCategory(scriptsData, category);
      const data = scriptsData[category];
      const matchingScripts = scripts.filter(script =>
        script.name.toLowerCase().includes(query) ||
        (script.description || '').toLowerCase().includes(query) ||
        category.toLowerCase().replace(/_/g, ' ').includes(query)
      );

      if (matchingScripts.length > 0) {
        if (isSectionedCategory(data)) {
          const bySection = {};
          matchingScripts.forEach(script => {
            for (const [secName, secScripts] of Object.entries(data)) {
              if (secScripts.some(s => s.id === script.id)) {
                if (!bySection[secName]) bySection[secName] = [];
                bySection[secName].push(script);
                break;
              }
            }
          });
          filtered[category] = bySection;
        } else {
          filtered[category] = matchingScripts;
        }
      }
    });

    return {
      categories: Object.keys(filtered),
      scriptsData: filtered
    };
  }, [searchQuery, categories, scriptsData]);

  // Auto-expand categories when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const expanded = {};
      filteredData.categories.forEach(cat => {
        expanded[cat] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [searchQuery, filteredData.categories]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (docsMenuRef.current && !docsMenuRef.current.contains(e.target)) {
        setShowDocsMenu(false);
      }
    };
    if (showDocsMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDocsMenu]);

  return (
    <div className="w-80 bg-dark-surface border-r border-dark-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center gap-3 mb-2">
          <Terminal className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">IT Script Generator</h1>
        </div>
        <p className="text-sm text-gray-400">PowerShell & CMD Scripts</p>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-dark-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-10 pr-10 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            Found {Object.values(filteredData.scriptsData).reduce((sum, v) =>
              sum + (Array.isArray(v) ? v.length : Object.values(v).reduce((s, arr) => s + arr.length, 0)), 0)} script(s)
          </p>
        )}
      </div>

      {/* Microsoft 365 Integration */}
      <div className="px-4 mb-2">
        <button
          onClick={onM365Select}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            viewMode === 'm365'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <Cloud className="w-5 h-5" />
          <div className="flex-1 text-left">
            <p className="font-semibold text-sm">Microsoft 365</p>
            <p className="text-xs opacity-80">Graph API Integration</p>
          </div>
        </button>
      </div>

      {/* Documentation - Quick Access */}
      {onOpenDoc && (
        <div ref={docsMenuRef} className="px-4 mb-2 relative">
          <button
            onClick={() => setShowDocsMenu(!showDocsMenu)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-700/50 bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium flex-1 text-left">Documentation</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDocsMenu ? 'rotate-180' : ''}`} />
          </button>
          {showDocsMenu && (
            <div className="absolute left-4 right-4 top-full mt-1 py-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50">
              {DOCS.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => { onOpenDoc(doc.id); setShowDocsMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-hover hover:text-white flex flex-col gap-0.5"
                >
                  <span className="font-medium">{doc.label}</span>
                  <span className="text-xs text-gray-500">{doc.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Scripts */}
      {onManageScripts && (
        <div className="px-4 mb-2">
          <button
            onClick={onManageScripts}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Manage Scripts</span>
          </button>
        </div>
      )}

      <div className="px-4 mb-4">
        <div className="h-px bg-slate-700"></div>
      </div>

      {/* Favorites + Categories */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {favoritedScripts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-gray-400">Favorites</span>
              <span className="ml-auto text-xs text-gray-500">{favoritedScripts.length}</span>
            </div>
            <div className="space-y-0.5">
              {favoritedScripts.map(({ category, script }) => (
                <button
                  key={script.id}
                  onClick={() => onScriptSelect(category, script.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedScript?.id === script.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{script.name}</span>
                </button>
              ))}
            </div>
            <div className="h-px bg-slate-700 mt-3"></div>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Loading scripts...</p>
          </div>
        ) : filteredData.categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No scripts found</p>
            <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredData.categories.map(category => {
            const structure = getCategoryStructure(filteredData.scriptsData, category);
            const renderScript = (script) => {
              const isM365Connect = script.id === 'm365-connect';
              const fav = isFavorite(script.id);
              return (
                <button
                  key={script.id}
                  onClick={() => onScriptSelect(category, script.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    selectedScript?.id === script.id
                      ? isM365Connect
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
                        : 'bg-blue-600 text-white'
                      : isM365Connect
                        ? 'bg-gradient-to-r from-orange-900/50 to-orange-800/50 text-orange-200 border border-orange-700/50 hover:from-orange-800/60 hover:to-orange-700/60'
                        : 'text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  {isM365Connect && <Plug className="w-4 h-4 flex-shrink-0" />}
                  <span className={`flex-1 truncate ${isM365Connect ? 'font-semibold' : ''}`}>{script.name}</span>
                  {isM365Connect && (
                    <span className="text-xs bg-orange-500/30 px-2 py-0.5 rounded-full border border-orange-500/50">
                      Connect First
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(script.id); }}
                    className={`p-0.5 rounded hover:bg-white/10 flex-shrink-0 ${fav ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400/70'}`}
                    title={fav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${fav ? 'fill-amber-400' : ''}`} />
                  </button>
                </button>
              );
            };

            return (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-hover transition-colors text-left"
                >
                  {expandedCategories[category] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  {getCategoryIcon(category)}
                  <span className="text-sm font-medium text-gray-200 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className="ml-auto text-xs text-gray-500">{structure.totalCount}</span>
                </button>

                {expandedCategories[category] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {structure.isSectioned ? (
                      structure.sections.map(({ name, scripts }) => {
                        const sectionKey = `${category}::${name}`;
                        const isExpanded = expandedSections[sectionKey] === true;
                        return (
                          <div key={name}>
                            <button
                              onClick={() => toggleSection(category, name)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dark-hover/50 text-left"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-500" />
                              )}
                              <span className="text-xs font-medium text-gray-400">{name}</span>
                              <span className="text-xs text-gray-500">({scripts.length})</span>
                            </button>
                            {isExpanded && (
                              <div className="ml-4 mt-0.5 space-y-0.5">
                                {scripts.map(script => renderScript(script))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      structure.sections[0]?.scripts.map(script => renderScript(script))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <p className="text-xs text-gray-500 text-center">
          v1.0.0 | IT Admin Tools
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
