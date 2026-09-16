import React, { useMemo, useState } from 'react';
import { X, BookOpen, Lightbulb, Search } from 'lucide-react';
import { networkDocumentation } from '../data/networkDocs';

const NetworkDocsModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('all');

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return networkDocumentation.sections
      .filter(section => activeSection === 'all' || section.id === activeSection)
      .map(section => ({
        ...section,
        concepts: section.concepts.filter(concept => {
          if (!q) return true;
          return (
            concept.name.toLowerCase().includes(q) ||
            concept.explanation.toLowerCase().includes(q) ||
            concept.example.toLowerCase().includes(q)
          );
        })
      }))
      .filter(section => section.concepts.length > 0);
  }, [query, activeSection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold text-white">{networkDocumentation.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{networkDocumentation.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-3 border-b border-dark-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts, for example DNS, VLAN, VPN..."
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeSection === 'all'
                  ? 'bg-cyan-900/40 border-cyan-600/60 text-cyan-200'
                  : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            {networkDocumentation.sections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyan-900/40 border-cyan-600/60 text-cyan-200'
                    : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredSections.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No concepts match that search.</p>
          ) : (
            filteredSections.map(section => (
              <div key={section.id}>
                <h3 className={`text-lg font-semibold ${section.color} mb-3`}>{section.title}</h3>
                <div className="space-y-3">
                  {section.concepts.map(concept => (
                    <div key={concept.name} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                      <h4 className="text-white font-semibold mb-2">{concept.name}</h4>
                      <p className="text-gray-300 text-sm mb-3">{concept.explanation}</p>
                      <div className="flex gap-2 bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-3">
                        <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-cyan-100/90">
                          <span className="font-semibold text-cyan-300">Example: </span>
                          {concept.example}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkDocsModal;
