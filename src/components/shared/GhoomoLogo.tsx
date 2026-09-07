'use client';

import React from 'react';
import { Compass } from 'lucide-react';

interface GhoomoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

export function GhoomoCompassIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-xl bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center text-white shadow-xs ${className}`}
    >
      <Compass size={Math.round(size * 0.6)} className="text-white" />
    </div>
  );
}

export function GhoomoWordmark({
  size = 'md',
  showSubtitle = true,
  subtitle = 'Smart Learning Guide',
}: {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
}) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col leading-none select-none">
      <div className={`flex items-baseline font-black tracking-tight ${textSizes[size]} font-heading`}>
        <span className="text-slate-900 dark:text-white">GHOO</span>
        <span className="text-indigo-600 dark:text-indigo-400">MO</span>
      </div>
      {showSubtitle && (
        <span className="text-[9px] font-bold tracking-[0.16em] text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default function GhoomoLogo({
  size = 'md',
  showSubtitle = true,
  subtitle,
  className = '',
}: GhoomoLogoProps) {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <GhoomoCompassIcon size={iconSizes[size]} />
      <GhoomoWordmark size={size} showSubtitle={showSubtitle} subtitle={subtitle} />
    </div>
  );
}
