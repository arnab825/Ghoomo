'use client';

import React from 'react';

import { useUIStore } from '@/stores/useUIStore';

interface GhoomoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

export function GhoomoPinIcon({ className = "h-9 w-9", size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* Clip path defining the outer map pin boundary */}
        <clipPath id="pinBoundary">
          <path d="M 50,114 C 46,108 12,68 12,45 C 12,24 29,7 50,7 C 71,7 88,24 88,45 C 88,68 54,108 50,114 Z" />
        </clipPath>
      </defs>

      {/* Pin Body clipped to the pin boundary */}
      <g clipPath="url(#pinBoundary)">
        {/* Top Half: Navy Blue (Dark Slate in Dark Mode) */}
        <rect x="0" y="0" width="100" height="52" className="fill-[#1e3a5f] dark:fill-[#223955]" />
        
        {/* Bottom Half: Radiant Coral / Saffron */}
        <rect x="0" y="52" width="100" height="70" className="fill-[#ff6347] dark:fill-[#f97316]" />
      </g>

      {/* Center White Airplane Silhouette */}
      <path
        d="M 50,22 
           C 47,24 45,30 45,41 
           L 18,56 
           C 16.5,57.5 17.5,59.5 20.5,59 
           L 45,54.5 
           L 45,74 
           L 36,80.5 
           C 34.5,81.5 35.5,82.8 37.5,82.5 
           L 46.5,79.5 
           L 47.5,85 
           C 48.5,86 51.5,86 52.5,85 
           L 53.5,79.5 
           L 62.5,82.5 
           C 64.5,82.8 65.5,81.5 64,80.5 
           L 55,74 
           L 55,54.5 
           L 79.5,59 
           C 82.5,59.5 83.5,57.5 82,56 
           L 55,41 
           C 55,30 53,24 50,22 Z"
        fill="#ffffff"
        className="drop-shadow-xs"
      />
    </svg>
  );
}

export function GhoomoWordmark({
  size = 'md',
  showSubtitle = true,
  subtitle,
}: {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
}) {
  const activeProductMode = useUIStore((s) => s.activeProductMode);

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const planeSizes = {
    sm: 11,
    md: 13,
    lg: 16,
  };

  const resolvedSubtitle =
    subtitle || (activeProductMode === 'travel' ? 'Social Travel Studio' : 'Smart Learning Journeys');

  return (
    <div className="flex flex-col leading-none select-none">
      <div className={`flex items-baseline font-black tracking-tight ${textSizes[size]} font-sans`}>
        {/* 'G' */}
        <span className="text-[#1e3a5f] dark:text-white">G</span>
        {/* 'h' */}
        <span className="text-[#ff6347] dark:text-[#f97316]">h</span>
        {/* 'o' */}
        <span className="text-[#1e3a5f] dark:text-white">o</span>
        {/* 'o' */}
        <span className="text-[#ff6347] dark:text-[#f97316]">o</span>
        
        {/* 'm' with tiny cute airplane taking off above it */}
        <span className="relative inline-flex items-center text-[#1e3a5f] dark:text-white">
          {/* Micro Airplane Taking Off Accent */}
          <span className="absolute -top-2.5 left-1 text-[#ff6347] dark:text-[#f97316] transform -rotate-12 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
            <svg width={planeSizes[size]} height={planeSizes[size]} viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </span>
          m
        </span>

        {/* 'o' */}
        <span className="text-[#ff6347] dark:text-[#f97316]">o</span>
      </div>

      {showSubtitle && (
        <span className="text-[8px] sm:text-[9px] font-extrabold tracking-[0.2em] text-[#ff6347] dark:text-orange-400 uppercase mt-0.5 opacity-95">
          {resolvedSubtitle}
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
  const iconDimensions = {
    sm: 28,
    md: 36,
    lg: 44,
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <GhoomoPinIcon size={iconDimensions[size]} />
      <GhoomoWordmark size={size} showSubtitle={showSubtitle} subtitle={subtitle} />
    </div>
  );
}
