import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Top-level application Error Boundary
 * Prevents the app from ever unmounting into a silent blank or black screen.
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AppErrorBoundary] Uncaught rendering exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-6 antialiased">
          <div className="glass-card rounded-3xl p-8 sm:p-10 border border-purple-500/30 max-w-lg w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-glow">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Dashboard Interface Notice
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                A rendering issue was intercepted safely. Click below to reload the dashboard state.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-dark-bg/80 border border-dark-border rounded-xl text-left font-mono text-[11px] text-purple-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-all shadow-glow flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
