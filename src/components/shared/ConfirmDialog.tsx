'use client';

import React from 'react';
import AppDialog from './AppDialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl font-semibold text-white ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-saffron-500 hover:bg-saffron-600'
            }`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {isDestructive && (
          <div className="shrink-0 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertTriangle size={22} />
          </div>
        )}
        <div>
          <h4 className="font-bold text-base text-slate-900 dark:text-white font-heading">
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </AppDialog>
  );
}
