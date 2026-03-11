import React from 'react';
import { X, BookOpen, Check, XCircle } from 'lucide-react';
import { backupDocumentation } from '../data/backupDocs';

const BackupDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-white">{backupDocumentation.title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{backupDocumentation.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {backupDocumentation.items.map((item) => (
            <div
              key={item.id}
              className="bg-dark-bg rounded-lg p-4 border border-dark-border"
            >
              <h3 className="text-base font-semibold text-white mb-2">{item.id}</h3>
              <p className="text-xs font-mono text-blue-400 mb-3">{item.path}</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{item.backsUp}</span>
                </div>
                <div className="flex gap-2">
                  <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">{item.doesNotBackUp}</span>
                </div>
                {item.restoreNote && (
                  <p className="text-xs text-gray-500 pl-6 border-l-2 border-dark-border mt-2">
                    <strong className="text-gray-400">Restore:</strong> {item.restoreNote}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BackupDocsModal;
