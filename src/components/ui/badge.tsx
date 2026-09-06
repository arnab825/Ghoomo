import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 gap-1',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
        secondary:
          'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
        outline:
          'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
        saffron:
          'border-orange-500/30 bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
        emerald:
          'border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-600/15 dark:text-emerald-300',
        teal:
          'border-teal-600/30 bg-teal-50 text-teal-700 dark:bg-teal-600/15 dark:text-teal-300',
        warning:
          'border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        destructive:
          'border-red-600/30 bg-red-50 text-red-700 dark:bg-red-600/15 dark:text-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
