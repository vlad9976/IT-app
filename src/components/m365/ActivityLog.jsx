import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ActivityLog = ({ activities = [] }) => {
  const [expandedError, setExpandedError] = useState(null);

  if (activities.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50"
          >
            {activity.success ? (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{activity.action}</p>
              {activity.details && (
                <p className="text-xs text-slate-400 mt-0.5">{activity.details}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
              {!activity.success && (activity.error || activity.details) && (
                <button
                  type="button"
                  onClick={() => setExpandedError(expandedError === index ? null : index)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {expandedError === index ? 'Hide error' : 'View error'}
                </button>
              )}
              {!activity.success && expandedError === index && (activity.error || activity.details) && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 font-mono whitespace-pre-wrap break-words">
                  {activity.error || activity.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
