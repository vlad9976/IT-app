import React, { useState, useEffect } from 'react';
import ScriptPreview from './ScriptPreview';
import InputField from './InputField';
import { FileCode, Copy, Check, Download, BookOpen, FileSpreadsheet } from 'lucide-react';

const BULK_CREATE_CSV_TEMPLATE = 'GivenName,Surname,SamAccountName,UserPrincipalName,OU,Description\nJohn,Doe,john.doe,john.doe@domain.com,OU=Users,User account\nJane,Smith,jane.smith,jane.smith@domain.com,OU=Users,User account';

const ScriptPanel = ({ script, onOpenDoc }) => {
  const [inputs, setInputs] = useState({});
  const [generatedScript, setGeneratedScript] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (script) {
      const initialInputs = {};
      script.inputs.forEach(input => {
        initialInputs[input.variable] = input.defaultValue || '';
      });
      setInputs(initialInputs);
    }
  }, [script]);

  useEffect(() => {
    if (script) {
      generateScript();
    }
  }, [inputs, script]);

  const generateScript = () => {
    if (!script) return;

    let scriptContent = script.template;
    
    Object.keys(inputs).forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      const val = inputs[variable];
      scriptContent = scriptContent.replace(regex, val !== undefined && val !== null ? String(val) : `{{${variable}}}`);
    });

    setGeneratedScript(scriptContent);
  };

  const handleInputChange = (variable, value) => {
    setInputs(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleCopyToClipboard = async () => {
    try {
      // Method 1: Modern Clipboard API (works in most browsers)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(generatedScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Method 2: Fallback using execCommand (works in terminals/older browsers)
      const textArea = document.createElement('textarea');
      textArea.value = generatedScript;
      
      // Make it invisible but accessible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        // Try to copy using execCommand
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (execErr) {
        console.error('execCommand copy failed:', execErr);
        
        // Method 3: Manual selection fallback (user can Ctrl+C)
        textArea.select();
        alert('Please press Ctrl+C (or Cmd+C on Mac) to copy the script');
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      
      // Final fallback: Show the script in a prompt/alert
      const shouldShowScript = confirm('Automatic copy failed. Would you like to see the script in a window to copy manually?');
      if (shouldShowScript) {
        prompt('Copy this script (Ctrl+C or Cmd+C):', generatedScript);
      }
    }
  };

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([BULK_CREATE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BulkCreateADUsers_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSaveToFile = () => {
    try {
      // Determine file extension based on script type
      const extension = script.type === 'powershell' ? 'ps1' : 'cmd';
      const fileName = `${script.id}_${Date.now()}.${extension}`;
      
      // Create blob with proper encoding for Windows
      const blob = new Blob([generatedScript], { type: 'text/plain;charset=utf-8' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save file:', err);
      alert('Failed to save file. Please try copying to clipboard instead.');
    }
  };

  if (!script) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <FileCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            No Script Selected
          </h2>
          <p className="text-gray-500">
            Select a script from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{script.name}</h2>
            <p className="text-gray-400">{script.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              script.type === 'powershell' 
                ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                : 'bg-gray-900/50 text-gray-300 border border-gray-700'
            }`}>
              {script.type.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Input Fields */}
          <div className="bg-dark-surface rounded-xl p-6 border border-dark-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Configuration
              </h3>
              {script.id === 'event-log-hunter' && onOpenDoc && (
                <button
                  onClick={() => onOpenDoc('event')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded-lg text-sm font-medium transition-colors border border-blue-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Event ID Documentation
                </button>
              )}
              {script.id === 'check-services' && onOpenDoc && (
                <button
                  onClick={() => onOpenDoc('service')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded-lg text-sm font-medium transition-colors border border-green-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Service Documentation
                </button>
              )}
              {script.id === 'port-scan' && onOpenDoc && (
                <button
                  onClick={() => onOpenDoc('port')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg text-sm font-medium transition-colors border border-purple-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Port Documentation
                </button>
              )}
              {script.id === 'm365-connect' && onOpenDoc && (
                <button
                  onClick={() => onOpenDoc('m365')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-900/50 hover:bg-orange-800/50 text-orange-300 rounded-lg text-sm font-medium transition-colors border border-orange-700"
                >
                  <BookOpen className="w-4 h-4" />
                  M365 License Guide
                </button>
              )}
              {script.id === 'ad-bulk-create-users-csv' && (
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 rounded-lg text-sm font-medium transition-colors border border-emerald-700"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download CSV Template
                </button>
              )}
              {script.id === 'domain-migration-smart-backup' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenDoc?.('backup')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 rounded-lg text-sm font-medium transition-colors border border-emerald-700"
                  >
                    <BookOpen className="w-4 h-4" />
                    Backup Guide
                  </button>
                  {script.inputs.some(i => i.type === 'checkbox') && (
                    <button
                      onClick={() => {
                        const updates = {};
                        script.inputs.filter(i => i.type === 'checkbox').forEach(i => { updates[i.variable] = 'false'; });
                        setInputs(prev => ({ ...prev, ...updates }));
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-600"
                    >
                      Uncheck All
                    </button>
                  )}
                </div>
              )}
              {script.id === 'disk-cleanup' && script.inputs.some(i => i.type === 'checkbox') && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 mr-1">Safe presets:</span>
                  {[
                    { label: 'Recommended', values: { UserTemp: 'true', WindowsTemp: 'true', RecycleBin: 'true', ThumbnailCache: 'true', DeliveryOptimization: 'true', WindowsUpdateCache: 'false', Prefetch: 'false', BrowserCache: 'true', OldLogs: 'true', RunCleanmgr: 'true' } },
                    { label: 'Quick', values: { UserTemp: 'true', WindowsTemp: 'true', RecycleBin: 'true', ThumbnailCache: 'true', DeliveryOptimization: 'false', WindowsUpdateCache: 'false', Prefetch: 'false', BrowserCache: 'false', OldLogs: 'false', RunCleanmgr: 'false' } },
                    { label: 'Full', values: { UserTemp: 'true', WindowsTemp: 'true', RecycleBin: 'true', ThumbnailCache: 'true', DeliveryOptimization: 'true', WindowsUpdateCache: 'true', Prefetch: 'true', BrowserCache: 'true', OldLogs: 'true', RunCleanmgr: 'true' } },
                    { label: 'Minimal', values: { UserTemp: 'true', WindowsTemp: 'false', RecycleBin: 'true', ThumbnailCache: 'false', DeliveryOptimization: 'false', WindowsUpdateCache: 'false', Prefetch: 'false', BrowserCache: 'false', OldLogs: 'false', RunCleanmgr: 'false' } },
                    { label: 'Clear all', values: { UserTemp: 'false', WindowsTemp: 'false', RecycleBin: 'false', ThumbnailCache: 'false', DeliveryOptimization: 'false', WindowsUpdateCache: 'false', Prefetch: 'false', BrowserCache: 'false', OldLogs: 'false', RunCleanmgr: 'false' } }
                  ].map(({ label, values }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, ...values }))}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-bg hover:bg-emerald-900/40 border border-dark-border hover:border-emerald-600/50 text-gray-300 hover:text-emerald-300 transition-colors"
                      title={label === 'Recommended' ? 'Best balance for most users' : label === 'Quick' ? 'Temp + Recycle Bin + thumbnails' : label === 'Full' ? 'All cleanup options' : label === 'Minimal' ? 'User temp + Recycle Bin only' : 'Uncheck all'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`grid gap-4 ${
              script.id === 'domain-migration-smart-backup' || script.id === 'disk-cleanup' || script.id === 'clear-ie-cache'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {script.inputs.map(input => (
                <div key={input.variable} className={(input.type === 'checkbox' && (script.id === 'domain-migration-smart-backup' || script.id === 'disk-cleanup' || script.id === 'clear-ie-cache')) ? '' : 'col-span-full'}>
                  <InputField
                    input={input}
                    value={inputs[input.variable] ?? input.defaultValue ?? (input.type === 'checkbox' ? 'false' : '')}
                    onChange={(value) => handleInputChange(input.variable, value)}
                  />
                </div>
              ))}
            </div>
            {script.id === 'check-services' && (
              <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Action</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('mode', 'check')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${(inputs.mode ?? 'check') === 'restart' ? 'bg-dark-bg border-dark-border text-gray-400 hover:text-green-300 hover:border-green-600/50' : 'bg-green-900/40 border-green-600/50 text-green-300'}`}
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('mode', 'restart')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${(inputs.mode ?? 'check') === 'restart' ? 'bg-green-900/40 border-green-600/50 text-green-300' : 'bg-dark-bg border-dark-border text-gray-400 hover:text-green-300 hover:border-green-600/50'}`}
                      >
                        Restart
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400">Service presets</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {[
                        { label: 'Common', services: 'Spooler,Bits,WinRM,Wuauserv' },
                        { label: 'Printing', services: 'Spooler' },
                        { label: 'Windows Update', services: 'wuauserv,BITS' },
                        { label: 'Network', services: 'LanmanServer,LanmanWorkstation,Dnscache,Dhcp' },
                        { label: 'Domain', services: 'Netlogon,LanmanWorkstation,Dnscache' },
                        { label: 'RDP', services: 'TermService,UmRdpService' },
                        { label: 'Event Log', services: 'EventLog' },
                        { label: 'Full', services: 'Spooler,Bits,WinRM,Wuauserv,LanmanServer,LanmanWorkstation,Dnscache,EventLog,TermService' },
                        { label: 'BITS', services: 'BITS' },
                        { label: 'WinRM', services: 'WinRM' },
                        { label: 'WIA / Scanner', services: 'stisvc' },
                        { label: 'DNS Client', services: 'Dnscache' },
                        { label: 'Windows Search', services: 'WSearch' }
                      ].map(({ label, services }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleInputChange('services', services)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-bg hover:bg-green-900/40 border border-dark-border hover:border-green-600/50 text-gray-300 hover:text-green-300 transition-colors"
                          title={services}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Restart requires Administrator privileges.</p>
              </div>
            )}
            {script.id === 'disk-cleanup' && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <p className="text-sm text-gray-400">Tip: Run as Administrator to use Windows Temp, Delivery Optimization, WU cache, and old logs.</p>
              </div>
            )}
            {script.id === 'event-log-hunter' && (
              <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
                <p className="text-sm text-amber-400/90">Security log requires running PowerShell as Administrator.</p>
                <p className="text-sm font-medium text-gray-400">Quick presets (auto-selects log)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'App Crashes', ids: '1000,1001,1002', log: 'Application' },
                    { label: 'Auth', ids: '4624,4625,4634', log: 'Security' },
                    { label: 'Account Mgmt', ids: '4720,4724,4726,4740', log: 'Security' },
                    { label: 'Files', ids: '4656,4663,4660', log: 'Security' },
                    { label: 'Privilege', ids: '4672,4673', log: 'Security' },
                    { label: 'Boot/Shutdown', ids: '6008,41,1074', log: 'System' },
                    { label: 'BSOD/WER', ids: '1001', log: 'Application' },
                    { label: 'Clear', ids: '', log: null }
                  ].map(({ label, ids, log }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        handleInputChange('event_ids', ids);
                        if (log) handleInputChange('log_name', log);
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-bg hover:bg-blue-900/40 border border-dark-border hover:border-blue-600/50 text-gray-300 hover:text-blue-300 transition-colors"
                      title={label === 'Clear' ? 'Clear Event IDs' : `${ids} (${log || 'any'} log)`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Script Preview */}
          <div className="bg-dark-surface rounded-xl p-6 border border-dark-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Generated Script
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-700 hover:bg-gray-600 text-white"
                  title="Save as file"
                >
                  <Download className="w-4 h-4" />
                  Save File
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <ScriptPreview script={generatedScript} type={script.type} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptPanel;
