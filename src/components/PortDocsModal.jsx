import React from 'react';
import { X, BookOpen, Shield, AlertTriangle, Info } from 'lucide-react';
import { portDocumentation } from '../data/portDocs';

const PortDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getSecurityIcon = (security) => {
    if (security.toLowerCase().includes('encrypted') || security.toLowerCase().includes('secure')) {
      return <Shield className="w-4 h-4 text-green-500" />;
    } else if (security.toLowerCase().includes('should not') || security.toLowerCase().includes('insecure')) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else {
      return <Info className="w-4 h-4 text-yellow-500" />;
    }
  };

  const renderPortSection = (section, key) => (
    <div key={key}>
      <h3 className={`text-lg font-semibold ${section.color} mb-3`}>
        {section.title}
      </h3>
      <div className="space-y-3">
        {section.ports.map((port, idx) => (
          <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
            <div className="flex items-start gap-3">
              {getSecurityIcon(port.security)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-lg font-bold bg-slate-800 px-3 py-1 rounded text-blue-400">
                    {port.port}
                  </span>
                  <span className="font-semibold text-white">{port.name}</span>
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                    {port.protocol}
                  </span>
                  {port.common && (
                    <span className="text-xs bg-green-900/50 px-2 py-0.5 rounded text-green-400 border border-green-700">
                      Common
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm mb-2">{port.description}</p>
                <div className="space-y-1">
                  <p className="text-gray-400 text-xs">
                    <span className="font-semibold text-gray-300">Usage:</span> {port.usage}
                  </p>
                  <p className="text-gray-400 text-xs">
                    <span className="font-semibold text-gray-300">Security:</span> {port.security}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Common Ports Documentation</h2>
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
          {/* Web Services */}
          {renderPortSection(portDocumentation.web, 'web')}

          {/* Email Services */}
          {renderPortSection(portDocumentation.email, 'email')}

          {/* File Transfer */}
          {renderPortSection(portDocumentation.fileTransfer, 'fileTransfer')}

          {/* Database */}
          {renderPortSection(portDocumentation.database, 'database')}

          {/* Remote Access */}
          {renderPortSection(portDocumentation.remote, 'remote')}

          {/* DNS & Network */}
          {renderPortSection(portDocumentation.dns, 'dns')}

          {/* Messaging */}
          {renderPortSection(portDocumentation.messaging, 'messaging')}

          {/* Monitoring */}
          {renderPortSection(portDocumentation.monitoring, 'monitoring')}

          {/* Gaming */}
          {renderPortSection(portDocumentation.gaming, 'gaming')}

          {/* Scanning Tips */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-800/50">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {portDocumentation.scanningTips.title}
            </h3>
            <div className="space-y-4">
              {portDocumentation.scanningTips.tips.map((tip, idx) => (
                <div key={idx} className="bg-dark-bg/50 rounded-lg p-4 border border-dark-border">
                  <div className="font-semibold text-white mb-1">{tip.title}</div>
                  <div className="text-gray-400 text-sm">{tip.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-lg p-6 border border-green-800/50">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Quick Reference - Most Common Ports</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">80</div>
                <div className="text-xs text-gray-400">HTTP Web</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">443</div>
                <div className="text-xs text-gray-400">HTTPS Secure Web</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">22</div>
                <div className="text-xs text-gray-400">SSH Secure Shell</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">21</div>
                <div className="text-xs text-gray-400">FTP File Transfer</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">3389</div>
                <div className="text-xs text-gray-400">RDP Remote Desktop</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">25</div>
                <div className="text-xs text-gray-400">SMTP Email</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">53</div>
                <div className="text-xs text-gray-400">DNS</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">445</div>
                <div className="text-xs text-gray-400">SMB File Sharing</div>
              </div>
              <div className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                <div className="font-mono text-blue-400 font-bold">3306</div>
                <div className="text-xs text-gray-400">MySQL Database</div>
              </div>
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

export default PortDocsModal;
