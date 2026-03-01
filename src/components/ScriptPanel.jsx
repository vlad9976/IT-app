import React, { useState, useEffect } from 'react';
import ScriptPreview from './ScriptPreview';
import InputField from './InputField';
import EventDocsModal from './EventDocsModal';
import ServiceDocsModal from './ServiceDocsModal';
import PortDocsModal from './PortDocsModal';
import M365LicenseDocsModal from './M365LicenseDocsModal';
import { FileCode, Copy, Check, Download, BookOpen } from 'lucide-react';

const ScriptPanel = ({ script }) => {
  const [inputs, setInputs] = useState({});
  const [generatedScript, setGeneratedScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEventDocs, setShowEventDocs] = useState(false);
  const [showServiceDocs, setShowServiceDocs] = useState(false);
  const [showPortDocs, setShowPortDocs] = useState(false);
  const [showM365LicenseDocs, setShowM365LicenseDocs] = useState(false);

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
      scriptContent = scriptContent.replace(regex, inputs[variable] || `{{${variable}}}`);
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
      {/* Documentation Modals */}
      <EventDocsModal isOpen={showEventDocs} onClose={() => setShowEventDocs(false)} />
      <ServiceDocsModal isOpen={showServiceDocs} onClose={() => setShowServiceDocs(false)} />
      <PortDocsModal isOpen={showPortDocs} onClose={() => setShowPortDocs(false)} />
      <M365LicenseDocsModal isOpen={showM365LicenseDocs} onClose={() => setShowM365LicenseDocs(false)} />
      
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
              {script.id === 'event-log-hunter' && (
                <button
                  onClick={() => setShowEventDocs(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded-lg text-sm font-medium transition-colors border border-blue-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Event ID Documentation
                </button>
              )}
              {script.id === 'check-services' && (
                <button
                  onClick={() => setShowServiceDocs(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded-lg text-sm font-medium transition-colors border border-green-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Service Documentation
                </button>
              )}
              {script.id === 'port-scan' && (
                <button
                  onClick={() => setShowPortDocs(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg text-sm font-medium transition-colors border border-purple-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Port Documentation
                </button>
              )}
              {script.id === 'm365-connect' && (
                <button
                  onClick={() => setShowM365LicenseDocs(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-900/50 hover:bg-orange-800/50 text-orange-300 rounded-lg text-sm font-medium transition-colors border border-orange-700"
                >
                  <BookOpen className="w-4 h-4" />
                  M365 License Guide
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {script.inputs.map(input => (
                <InputField
                  key={input.variable}
                  input={input}
                  value={inputs[input.variable] || ''}
                  onChange={(value) => handleInputChange(input.variable, value)}
                />
              ))}
            </div>
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
