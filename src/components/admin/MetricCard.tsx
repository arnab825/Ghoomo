'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  description,
  icon,
  onClick,
  className = '',
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-saffron-500 hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
          {value}
        </div>
        {change && (
          <div
            className={`flex items-center text-xs font-semibold ${
              trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-500'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight size={14} />
            ) : trend === 'down' ? (
              <ArrowDownRight size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-3xs text-slate-400 mt-2 line-clamp-1">
          {description}
        </p>
      )}
    </div>
  );
}
