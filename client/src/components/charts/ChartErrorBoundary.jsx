import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Chart Error Boundary Component
 * Catches rendering errors in individual charts without crashing the entire dashboard.
 */
export class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[Chart Error Boundary Caught Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-2xl p-6 border border-dark-border flex flex-col items-center justify-center min-h-[280px] text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-200 mb-1">
            {this.props.title || 'Chart Rendering Error'}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Unable to render this visual with current data format.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
