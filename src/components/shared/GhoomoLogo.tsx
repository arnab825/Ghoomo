'use client';

import React from 'react';

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
      className={`rounded-xl overflow-hidden bg-white dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shadow-xs shrink-0 ${className}`}
    >
      <img
        src="/image/EduSpark-icon.png"
        alt="EduSpark Icon"
        className="h-full w-full object-contain select-none"
      />
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
        <span className="text-[#026cb5] dark:text-[#38bdf8]">edu</span>
        <span className="text-[#f58220] dark:text-[#fb923c]">spark</span>
      </div>
      {showSubtitle && (
        <span className="text-[9px] font-bold tracking-[0.16em] text-slate-500 dark:text-slate-400 uppercase mt-0.5">
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

// Named aliases for clean branding
export const EduSparkLogo = GhoomoLogo;
export const EduSparkIcon = GhoomoCompassIcon;
export const EduSparkWordmark = GhoomoWordmark;
