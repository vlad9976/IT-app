import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Terminal, FolderOpen, Search, X, Plug } from 'lucide-react';

const Sidebar = ({ categories, scriptsData, onScriptSelect, selectedScript }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
      const matchingScripts = scriptsData[category].filter(script => 
        script.name.toLowerCase().includes(query) ||
        script.description.toLowerCase().includes(query) ||
        category.toLowerCase().replace(/_/g, ' ').includes(query)
      );

      if (matchingScripts.length > 0) {
        filtered[category] = matchingScripts;
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
            Found {Object.values(filteredData.scriptsData).reduce((sum, scripts) => sum + scripts.length, 0)} script(s)
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredData.categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No scripts found</p>
            <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredData.categories.map(category => (
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
                <span className="ml-auto text-xs text-gray-500">
                  {filteredData.scriptsData[category].length}
                </span>
              </button>

              {expandedCategories[category] && (
                <div className="ml-6 mt-1 space-y-1">
                  {filteredData.scriptsData[category].map(script => {
                    const isM365Connect = script.id === 'm365-connect';
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
                        {isM365Connect && (
                          <Plug className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className={isM365Connect ? 'font-semibold' : ''}>
                          {script.name}
                        </span>
                        {isM365Connect && (
                          <span className="ml-auto text-xs bg-orange-500/30 px-2 py-0.5 rounded-full border border-orange-500/50">
                            Connect First
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
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
