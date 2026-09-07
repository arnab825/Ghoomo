'use client';

import React from 'react';

interface MinimapNode {
  id: string;
  x: number;
  y: number;
  status: string;
}

interface MinimapEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface LearningMapMinimapProps {
  nodes: MinimapNode[];
  edges: MinimapEdge[];
  viewBox: { x: number; y: number; width: number; height: number };
  canvasBounds: { width: number; height: number };
  onNavigate?: (x: number, y: number) => void;
}

const STATUS_MINIMAP_COLORS: Record<string, string> = {
  MASTERED: '#10b981', // emerald-500
  NEEDS_REVIEW: '#f43f5e', // rose-500
  DEVELOPING: '#f59e0b', // amber-500
  PROVISIONALLY_READY: '#0ea5e9', // sky-500
  EXPOSED: '#6366f1', // indigo-500
  LOCKED: '#64748b', // slate-500
  UNKNOWN: '#94a3b8', // slate-400
};

export default function LearningMapMinimap({
  nodes,
  edges,
  viewBox,
  canvasBounds,
  onNavigate,
}: LearningMapMinimapProps) {
  const minimapWidth = 160;
  const minimapHeight = 110;

  // Scale factors
  const scaleX = minimapWidth / (canvasBounds.width || 1000);
  const scaleY = minimapHeight / (canvasBounds.height || 800);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onNavigate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetX = clickX / scaleX;
    const targetY = clickY / scaleY;
    onNavigate(targetX, targetY);
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg p-2 transition-all select-none">
      <div className="text-3xs uppercase font-bold text-slate-400 mb-1 px-1 flex items-center justify-between">
        <span>Map Overview</span>
      </div>
      <svg
        width={minimapWidth}
        height={minimapHeight}
        onClick={handleClick}
        className="cursor-pointer rounded-lg bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/60"
      >
        {/* Render edges */}
        {edges.map((edge, idx) => (
          <line
            key={idx}
            x1={edge.fromX * scaleX}
            y1={edge.fromY * scaleY}
            x2={edge.toX * scaleX}
            y2={edge.toY * scaleY}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        ))}

        {/* Render nodes */}
        {nodes.map((node) => {
          const color = STATUS_MINIMAP_COLORS[node.status] || STATUS_MINIMAP_COLORS.UNKNOWN;
          return (
            <circle
              key={node.id}
              cx={node.x * scaleX}
              cy={node.y * scaleY}
              r={node.status === 'MASTERED' ? 4 : 3}
              fill={color}
            />
          );
        })}

        {/* Viewport indicator box */}
        <rect
          x={viewBox.x * scaleX}
          y={viewBox.y * scaleY}
          width={Math.max(16, viewBox.width * scaleX)}
          height={Math.max(12, viewBox.height * scaleY)}
          fill="rgba(255, 153, 51, 0.15)"
          stroke="#ff9933"
          strokeWidth="1.5"
          rx="2"
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
}
