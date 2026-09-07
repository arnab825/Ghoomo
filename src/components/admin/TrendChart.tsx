'use client';

import React from 'react';

interface TrendChartProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: 'saffron' | 'indigo' | 'emerald' | 'rose';
  showPoints?: boolean;
  className?: string;
}

const COLORS = {
  saffron: { stroke: '#ff9933', fill: 'rgba(255, 153, 51, 0.12)' },
  indigo: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.12)' },
  emerald: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)' },
  rose: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.12)' },
};

export default function TrendChart({
  data,
  labels,
  height = 80,
  color = 'saffron',
  showPoints = true,
  className = '',
}: TrendChartProps) {
  if (!data || data.length === 0) return null;

  const width = 300;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 10;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((val - min) / range) * (height - 2 * padding);
    return { x, y, val };
  });

  const pathData = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const theme = COLORS[color] || COLORS.saffron;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Shaded Area */}
        <path d={areaData} fill={theme.fill} />

        {/* Trend Line */}
        <path
          d={pathData}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showPoints &&
          points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="#ffffff"
              stroke={theme.stroke}
              strokeWidth="2"
            />
          ))}
      </svg>

      {labels && labels.length === data.length && (
        <div className="flex justify-between text-3xs text-slate-400 mt-1.5 px-1 font-mono">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
