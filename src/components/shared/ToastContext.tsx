'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => Promise<void> | void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  confirmModal: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const [isConfirmPending, setIsConfirmPending] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toastMethods = {
    success: (message: string, title?: string) => addToast('success', message, title || 'Success'),
    error: (message: string, title?: string) => addToast('error', message, title || 'Error'),
    info: (message: string, title?: string) => addToast('info', message, title || 'Notice'),
    warning: (message: string, title?: string) => addToast('warning', message, title || 'Attention'),
  };

  const confirmModal = useCallback((options: ConfirmOptions) => {
    setConfirmDialog({ ...options, isOpen: true });
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    try {
      setIsConfirmPending(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (err) {
      console.error(err);
      toastMethods.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsConfirmPending(false);
    }
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, confirmModal }}>
      {children}

      {/* Floating Toast Container (Toastify style - Top Right) */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border p-3.5 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${
              t.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-50/95 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-500/40 dark:text-emerald-100'
                : t.type === 'error'
                ? 'border-rose-500/30 bg-rose-50/95 text-rose-950 dark:bg-rose-950/90 dark:border-rose-500/40 dark:text-rose-100'
                : t.type === 'warning'
                ? 'border-amber-500/30 bg-amber-50/95 text-amber-950 dark:bg-amber-950/90 dark:border-amber-500/40 dark:text-amber-100'
                : 'border-orange-500/30 bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:border-orange-500/40 dark:text-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
                {t.type === 'error' && <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />}
                {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />}
                {t.type === 'info' && <Info size={18} className="text-orange-600 dark:text-orange-400" />}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                {t.title && <div className="text-xs font-bold leading-tight mb-0.5">{t.title}</div>}
                <div className="text-xs leading-relaxed opacity-90">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Auto-dismiss progress bar animation */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 w-full ${
                t.type === 'success'
                  ? 'bg-emerald-500'
                  : t.type === 'error'
                  ? 'bg-rose-500'
                  : t.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-orange-500'
              }`}
              style={{
                animation: `toast-progress ${t.duration || 4000}ms linear forwards`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Modern Confirmation Popup Modal (Replaces browser window.confirm) */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-150 space-y-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.variant === 'warning'
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {confirmDialog.variant === 'warning' ? (
                  <AlertTriangle size={22} />
                ) : (
                  <Trash2 size={22} />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                disabled={isConfirmPending}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 cursor-pointer transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {confirmDialog.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isConfirmPending}
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 ${
                  confirmDialog.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {isConfirmPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmDialog.confirmText || 'Confirm Delete'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
