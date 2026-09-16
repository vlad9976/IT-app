import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';

const SearchSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Search...', 
  loading = false,
  required = false,
  disabled = false,
  onSearch,
  error,
  searchError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  // Filter local options when searchTerm or options change (no API call)
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Trigger API search only when searchTerm changes - exclude options/onSearch to avoid
  // re-calling on every API response (which would cause infinite loop / app freeze)
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) return;
    onSearchRef.current?.(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'
        } ${
          error ? 'border-red-500' : isOpen ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {selectedOption && !disabled && (
              <button
                onClick={handleClear}
                className="hover:bg-slate-500 rounded p-1 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-slate-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-48">
            {searchError ? (
              <div className="px-4 py-6 text-center">
                <p className="text-red-400 text-sm font-medium">Search failed</p>
                <p className="text-red-300/80 text-xs mt-1">{searchError}</p>
                <p className="text-slate-500 text-xs mt-2">Check connectivity, firewall, proxy, and M365 permissions.</p>
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    option.value === value
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-slate-400 mt-0.5">{option.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400">
                {loading ? 'Searching...' : 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
