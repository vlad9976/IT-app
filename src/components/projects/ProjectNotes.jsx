import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function ProjectNotes({ notes = [], onAdd, readOnly = false }) {
  const [text, setText] = useState('');
  const list = Array.isArray(notes) ? notes : [];

  const handleAdd = () => {
    const t = text.trim();
    if (!t || !onAdd) return;
    onAdd({ author: 'Current User', timestamp: new Date().toISOString(), text: t });
    setText('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-300">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium">Notes</span>
      </div>
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {list.map((n, i) => (
          <li
            key={i}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-slate-200"
          >
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{n.author}</span>
              <span>{n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</span>
            </div>
            <p className="whitespace-pre-wrap">{n.text}</p>
          </li>
        ))}
      </ul>
      {!readOnly && onAdd && (
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-1 text-sm self-end"
          >
            <Send className="w-4 h-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
