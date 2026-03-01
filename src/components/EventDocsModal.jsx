import React from 'react';
import { X, BookOpen, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { eventDocumentation } from '../data/eventDocs';

const EventDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Windows Event ID Documentation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Authentication */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.authentication.color} mb-3`}>
              {eventDocumentation.authentication.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.authentication.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privilege */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.privilege.color} mb-3`}>
              {eventDocumentation.privilege.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.privilege.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Management */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.accountManagement.color} mb-3`}>
              {eventDocumentation.accountManagement.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.accountManagement.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Management */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.groupManagement.color} mb-3`}>
              {eventDocumentation.groupManagement.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.groupManagement.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processes */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.processes.color} mb-3`}>
              {eventDocumentation.processes.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.processes.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistence */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.persistence.color} mb-3`}>
              {eventDocumentation.persistence.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.persistence.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Integrity */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.systemIntegrity.color} mb-3`}>
              {eventDocumentation.systemIntegrity.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.systemIntegrity.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network */}
          <div>
            <h3 className={`text-lg font-semibold ${eventDocumentation.network.color} mb-3`}>
              {eventDocumentation.network.title}
            </h3>
            <div className="space-y-3">
              {eventDocumentation.network.events.map((event) => (
                <div key={event.id} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {event.id}
                        </span>
                        <span className="font-semibold text-white">{event.name}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{event.description}</p>
                      <p className="text-gray-500 text-xs">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigation Scenarios */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-800/50">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Common Investigation Scenarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventDocumentation.investigations.scenarios.map((scenario, idx) => (
                <div key={idx} className="bg-dark-bg/50 rounded-lg p-4 border border-dark-border">
                  <div className="font-semibold text-white mb-1">{scenario.name}</div>
                  <div className="font-mono text-xs text-blue-400 mb-2">{scenario.eventIds}</div>
                  <div className="text-gray-400 text-xs">{scenario.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDocsModal;
