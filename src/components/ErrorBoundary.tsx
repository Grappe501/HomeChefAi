import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SousChef ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-dvh flex items-center justify-center p-6 bg-stainless-50">
          <div className="max-w-md w-full rounded-xl border border-steel bg-white p-6 space-y-4 text-center">
            <p className="font-display text-xl text-chef">Something went wrong</p>
            <p className="text-sm text-chef-subtle">
              SousChef hit an unexpected error. Your data is safe — try refreshing or heading home.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary text-sm !min-h-[44px]"
              >
                Refresh
              </button>
              <Link to="/" className="btn-secondary text-sm !min-h-[44px] inline-flex items-center justify-center">
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
