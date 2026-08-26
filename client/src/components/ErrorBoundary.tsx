import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="p-4 bg-red-100 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4 max-w-md">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {this.state.error && (
            <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-100 p-2 rounded max-w-lg overflow-auto">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleRetry}>
            <RefreshCw size={16} className="mr-2" /> Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
