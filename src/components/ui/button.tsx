'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] enabled:cursor-pointer disabled:cursor-not-allowed gap-2',
  {
    variants: {
      variant: {
        default:
          'bg-teal-600 text-white font-medium shadow-xs hover:bg-teal-700 focus-visible:ring-teal-500',
        primary:
          'bg-teal-600 text-white font-medium shadow-xs hover:bg-teal-700 focus-visible:ring-teal-500',
        secondary:
          'bg-white border border-teal-600 text-teal-600 hover:bg-teal-50 shadow-xs dark:bg-slate-900 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-slate-800',
        cta:
          'bg-orange-500 text-white font-semibold shadow-xs hover:bg-orange-600 focus-visible:ring-orange-500',
        outline:
          'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-xs focus-visible:ring-red-500',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs focus-visible:ring-emerald-500',
        teal:
          'bg-teal-600 text-white font-medium hover:bg-teal-700 shadow-xs focus-visible:ring-teal-500',
        emerald:
          'bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-xs focus-visible:ring-emerald-500',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base font-semibold',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
