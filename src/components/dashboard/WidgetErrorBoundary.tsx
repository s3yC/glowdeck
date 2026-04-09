'use client';

import React from 'react';
import type { WidgetType } from '@/types';

interface WidgetErrorBoundaryProps {
  widgetId: string;
  widgetType: WidgetType;
  children: React.ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[Widget ${this.props.widgetType}:${this.props.widgetId}]`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-3 w-full h-full p-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="text-2xl">&#x26A0;</div>
          <p className="text-sm text-center">
            Something went wrong with this widget.
          </p>
          {this.state.error && (
            <p
              className="text-xs text-center max-w-[200px] truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
