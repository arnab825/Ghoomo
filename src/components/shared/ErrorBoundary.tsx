'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught component exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-lg border border-red-200 bg-red-50/70 dark:border-rose-900/50 dark:bg-rose-950/20 text-center space-y-3">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md bg-red-100 dark:bg-rose-900/40 text-red-600 dark:text-rose-400">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {this.props.fallbackTitle || 'Something unexpected occurred'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {this.props.fallbackMessage ||
                this.state.error?.message ||
                'We ran into an issue while rendering this section. Your learning progress is completely safe.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              onClick={this.handleReset}
              size="sm"
              className="bg-saffron-500 hover:bg-saffron-600 text-white text-xs rounded-xl shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw size={13} className="mr-1.5" />
              <span>Try Again</span>
            </Button>

            <Link href="/app">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs rounded-xl shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Home size={13} className="mr-1.5" />
                <span>Return to Learning Map</span>
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
