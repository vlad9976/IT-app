import React from 'react';

const ScriptPreview = ({ script, type }) => {
  return (
    <div className="relative">
      <pre className="bg-slate-900 rounded-lg p-6 overflow-x-auto border border-slate-800">
        <code className={`language-${type} text-sm text-gray-300 leading-relaxed`}>
          {script}
        </code>
      </pre>
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 bg-slate-800 text-gray-400 text-xs rounded font-mono">
          {type}
        </span>
      </div>
    </div>
  );
};

export default ScriptPreview;
