import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // Listen for update events from main process
    if (window.electron && window.electron.onUpdateLog) {
      window.electron.onUpdateLog((message) => {
        console.log('[Update]', message);
        
        if (message.includes('Checking for updates')) {
          setUpdateStatus('checking');
        } else if (message.includes('Update available')) {
          setUpdateStatus('available');
          const version = message.match(/v([\d.]+)/)?.[1];
          setUpdateInfo({ version });
        } else if (message.includes('up to date')) {
          setUpdateStatus('up-to-date');
          setTimeout(() => setUpdateStatus(null), 5000);
        } else if (message.includes('Downloading')) {
          setUpdateStatus('downloading');
        } else if (message.includes('downloaded successfully')) {
          setUpdateStatus('ready');
        } else if (message.includes('error')) {
          setUpdateStatus('error');
          setTimeout(() => setUpdateStatus(null), 10000);
        }
      });
    }
  }, []);

  if (!updateStatus) return null;

  const statusConfig = {
    checking: {
      icon: RefreshCw,
      text: 'Checking for updates...',
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
      border: 'border-blue-700/50',
      spin: true
    },
    available: {
      icon: Download,
      text: `Update available: v${updateInfo?.version || ''}`,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-700/50'
    },
    downloading: {
      icon: Download,
      text: 'Downloading update...',
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-700/50',
      spin: true
    },
    ready: {
      icon: CheckCircle,
      text: 'Update ready to install',
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-700/50'
    },
    'up-to-date': {
      icon: CheckCircle,
      text: 'App is up to date',
      color: 'text-green-400',
      bg: 'bg-green-900/30',
      border: 'border-green-700/50'
    },
    error: {
      icon: AlertCircle,
      text: 'Update check failed',
      color: 'text-red-400',
      bg: 'bg-red-900/30',
      border: 'border-red-700/50'
    }
  };

  const config = statusConfig[updateStatus];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`fixed bottom-4 right-4 ${config.bg} ${config.border} border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm z-50 min-w-[280px]`}>
      <div className="flex items-center gap-3">
        <Icon 
          className={`w-5 h-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    </div>
  );
};

export default UpdateNotification;
