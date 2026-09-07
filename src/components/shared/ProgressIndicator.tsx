'use client';

import React from 'react';

interface ProgressIndicatorProps {
  value: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bar' | 'ring';
  showLabel?: boolean;
  label?: string;
  color?: 'saffron' | 'indigo' | 'emerald' | 'amber' | 'coral';
  className?: string;
}

const COLOR_CLASSES = {
  saffron: {
    bar: 'bg-saffron-500',
    ring: 'stroke-saffron-500',
    bg: 'bg-saffron-100 dark:bg-saffron-950/40',
    text: 'text-saffron-600 dark:text-saffron-400',
  },
  indigo: {
    bar: 'bg-indigo-600',
    ring: 'stroke-indigo-600',
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bar: 'bg-emerald-500',
    ring: 'stroke-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bar: 'bg-amber-500',
    ring: 'stroke-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
  },
  coral: {
    bar: 'bg-rose-500',
    ring: 'stroke-rose-500',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

export default function ProgressIndicator({
  value,
  size = 'md',
  variant = 'bar',
  showLabel = false,
  label,
  color = 'saffron',
  className = '',
}: ProgressIndicatorProps) {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
  const palette = COLOR_CLASSES[color] || COLOR_CLASSES.saffron;

  if (variant === 'ring') {
    const dimensions = size === 'sm' ? 36 : size === 'lg' ? 64 : 48;
    const strokeWidth = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
    const radius = (dimensions - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg width={dimensions} height={dimensions} className="transform -rotate-90">
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-200 dark:stroke-slate-800 fill-none"
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${palette.ring} fill-none transition-all duration-500 ease-out`}
          />
        </svg>
        {showLabel && (
          <span className={`absolute text-2xs font-bold ${palette.text}`}>
            {clampedValue}%
          </span>
        )}
      </div>
    );
  }

  // Default: Bar
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {(label || showLabel) && (
        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showLabel && <span className="font-semibold text-slate-900 dark:text-white">{clampedValue}%</span>}
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${palette.bg} ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full ${palette.bar} transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
