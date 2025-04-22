import React, { Component, ErrorInfo, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error);
    console.error('Error info:', errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <X className="w-12 h-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">Please try refreshing the page</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}