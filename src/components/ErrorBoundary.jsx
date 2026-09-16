import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-slate-900 p-6">
          <div className="max-w-2xl w-full bg-slate-800 rounded-lg p-8 border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                <p className="text-slate-400">The application encountered an error</p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-mono text-sm">{this.state.error.toString()}</p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Reload Application
            </button>

            <details className="mt-4">
              <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
                Show error details
              </summary>
              <pre className="mt-2 text-xs text-slate-500 overflow-auto max-h-64 bg-slate-900 p-4 rounded">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
