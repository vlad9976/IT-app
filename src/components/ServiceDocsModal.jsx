import React from 'react';
import { X, BookOpen, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { serviceDocumentation } from '../data/serviceDocs';

const ServiceDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getImportanceIcon = (importance) => {
    switch (importance) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Windows Services Documentation</h2>
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
          {/* System Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.system.color} mb-3`}>
              {serviceDocumentation.system.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.system.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.network.color} mb-3`}>
              {serviceDocumentation.network.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.network.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.security.color} mb-3`}>
              {serviceDocumentation.security.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.security.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remote Access Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.remote.color} mb-3`}>
              {serviceDocumentation.remote.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.remote.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage & Disk Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.storage.color} mb-3`}>
              {serviceDocumentation.storage.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.storage.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Services */}
          <div>
            <h3 className={`text-lg font-semibold ${serviceDocumentation.application.color} mb-3`}>
              {serviceDocumentation.application.title}
            </h3>
            <div className="space-y-3">
              {serviceDocumentation.application.services.map((service, idx) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start gap-3">
                    {getImportanceIcon(service.importance)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                          {service.name}
                        </span>
                        <span className="font-semibold text-white">{service.displayName}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-1">{service.description}</p>
                      <p className="text-gray-500 text-xs">{service.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting Scenarios */}
          <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-lg p-6 border border-orange-800/50">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Common Troubleshooting Scenarios
            </h3>
            <div className="space-y-4">
              {serviceDocumentation.troubleshooting.scenarios.map((scenario, idx) => (
                <div key={idx} className="bg-dark-bg/50 rounded-lg p-4 border border-dark-border">
                  <div className="font-semibold text-white mb-1">{scenario.issue}</div>
                  <div className="font-mono text-xs text-blue-400 mb-2">Services: {scenario.services}</div>
                  <div className="text-gray-400 text-sm">{scenario.solution}</div>
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

export default ServiceDocsModal;
