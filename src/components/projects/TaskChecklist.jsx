import React, { useState } from 'react';
import { Check, Square, Trash2, Plus } from 'lucide-react';
import { progressFromTasks } from './projectUtils';

const defaultTasks = { tasks: [] };

export default function TaskChecklist({ tasks = defaultTasks, onChange, readOnly = false }) {
  const list = Array.isArray(tasks.tasks) ? tasks.tasks : [];
  const [newTitle, setNewTitle] = useState('');

  const progress = progressFromTasks(tasks);

  const updateTasks = (nextList) => {
    const next = { tasks: nextList };
    onChange?.(next);
  };

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    updateTasks([...list, { title, completed: false }]);
    setNewTitle('');
  };

  const toggle = (index) => {
    const next = list.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t));
    updateTasks(next);
  };

  const remove = (index) => {
    updateTasks(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Tasks</span>
        <span className="text-xs text-slate-500">Progress: {progress}%</span>
      </div>
      <ul className="space-y-2">
        {list.map((t, i) => (
          <li
            key={i}
            className="flex items-center gap-2 py-1.5 px-2 rounded bg-slate-800/50 border border-slate-700"
          >
            <button
              type="button"
              onClick={() => !readOnly && toggle(i)}
              className="flex-shrink-0 text-slate-400 hover:text-emerald-400"
              title={t.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {t.completed ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <span
              className={`flex-1 text-sm ${t.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}
            >
              {t.title}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 text-slate-400 hover:text-red-400"
                title="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={addTask}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
