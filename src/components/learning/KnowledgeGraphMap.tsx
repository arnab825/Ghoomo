'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Concept,
  ConceptPrerequisite,
  LearnerConceptState,
  KnowledgeState,
  LearningActivity,
} from '@/lib/types/engine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Layers,
  Search,
  ListFilter,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TopicDetailDrawer from './TopicDetailDrawer';
import LearningMapMinimap from './LearningMapMinimap';
import { formatLearnerState } from '@/lib/utils/terminology';

interface KnowledgeGraphMapProps {
  concepts: Concept[];
  prerequisites: ConceptPrerequisite[];
  learnerStates: Map<string, LearnerConceptState>;
  activities?: LearningActivity[];
  onSelectConcept?: (concept: Concept) => void;
  activeRouteConceptIds?: string[];
}

interface NodeLayout {
  id: string;
  concept: Concept;
  x: number;
  y: number;
  width: number;
  height: number;
  cluster: string;
  status: string;
  isLocked: boolean;
  score: number;
}

export default function KnowledgeGraphMap({
  concepts,
  prerequisites,
  learnerStates,
  activities = [],
  onSelectConcept,
  activeRouteConceptIds = [],
}: KnowledgeGraphMapProps) {
  // Drawer state
  const [inspectingConceptId, setInspectingConceptId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('ALL');

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Build prerequisite lookup
  const prereqMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of prerequisites) {
      if (!map.has(p.conceptId)) map.set(p.conceptId, []);
      map.get(p.conceptId)!.push(p.prerequisiteConceptId);
    }
    return map;
  }, [prerequisites]);

  // Derive knowledge areas / clusters
  const clusters = useMemo(() => {
    const set = new Set<string>();
    concepts.forEach((c) => {
      const cluster = c.domain || 'Core';
      set.add(cluster);
    });
    return Array.from(set);
  }, [concepts]);

  // Compute Layout coordinates for concepts (grouped in logical columns / topological flow)
  const { nodes, edges, canvasBounds } = useMemo(() => {
    if (concepts.length === 0) {
      return { nodes: [], edges: [], canvasBounds: { width: 800, height: 600 } };
    }

    // Assign in-degrees to create logical layers
    const inDegree = new Map<string, number>();
    concepts.forEach((c) => inDegree.set(c.id, 0));
    prerequisites.forEach((p) => {
      const curr = inDegree.get(p.conceptId) || 0;
      inDegree.set(p.conceptId, curr + 1);
    });

    // Group into tiers based on prerequisite depth
    const tiers: Concept[][] = [];
    const visited = new Set<string>();

    let currentTier = concepts.filter((c) => (inDegree.get(c.id) || 0) === 0);
    if (currentTier.length === 0) currentTier = [concepts[0]];

    currentTier.forEach((c) => visited.add(c.id));
    tiers.push(currentTier);

    while (visited.size < concepts.length) {
      const nextTier: Concept[] = [];
      concepts.forEach((c) => {
        if (!visited.has(c.id)) {
          const prereqs = prereqMap.get(c.id) || [];
          const allPrereqsPlaced = prereqs.every((pId) => visited.has(pId));
          if (allPrereqsPlaced || tiers.length > 5) {
            nextTier.push(c);
          }
        }
      });

      if (nextTier.length === 0) {
        // Break cycle or disconnected node
        const remaining = concepts.filter((c) => !visited.has(c.id));
        tiers.push(remaining);
        remaining.forEach((c) => visited.add(c.id));
        break;
      }

      nextTier.forEach((c) => visited.add(c.id));
      tiers.push(nextTier);
    }

    // Position nodes along a readable, roadmap.sh style canvas
    const nodeWidth = 220;
    const nodeHeight = 84;
    const colSpacing = 320;
    const rowSpacing = 140;

    const layoutNodes: NodeLayout[] = [];
    const nodePosMap = new Map<string, { x: number; y: number }>();

    let maxX = 800;
    let maxY = 600;

    tiers.forEach((tier, colIdx) => {
      const colX = 80 + colIdx * colSpacing;
      tier.forEach((concept, rowIdx) => {
        const rowY = 80 + rowIdx * rowSpacing;
        const stateObj = learnerStates.get(concept.id);
        const prereqs = prereqMap.get(concept.id) || [];
        const arePrereqsSatisfied =
          prereqs.length === 0 ||
          prereqs.every((pId) => {
            const s = learnerStates.get(pId);
            return s && (s.state === 'MASTERED' || s.state === 'PROVISIONALLY_READY');
          });

        const isLocked =
          (stateObj?.state === 'UNKNOWN' || !stateObj) &&
          !arePrereqsSatisfied &&
          prereqs.length > 0;

        const status = isLocked ? 'LOCKED' : stateObj?.state || 'UNKNOWN';

        layoutNodes.push({
          id: concept.id,
          concept,
          x: colX,
          y: rowY,
          width: nodeWidth,
          height: nodeHeight,
          cluster: concept.domain || 'Foundations',
          status,
          isLocked,
          score: stateObj?.score || 0,
        });

        nodePosMap.set(concept.id, {
          x: colX + nodeWidth / 2,
          y: rowY + nodeHeight / 2,
        });

        maxX = Math.max(maxX, colX + nodeWidth + 120);
        maxY = Math.max(maxY, rowY + nodeHeight + 120);
      });
    });

    // Build SVG curved edges
    const layoutEdges = prerequisites
      .map((p) => {
        const from = nodePosMap.get(p.prerequisiteConceptId);
        const to = nodePosMap.get(p.conceptId);
        if (!from || !to) return null;

        const isRouteActive =
          activeRouteConceptIds.includes(p.prerequisiteConceptId) &&
          activeRouteConceptIds.includes(p.conceptId);

        return {
          fromId: p.prerequisiteConceptId,
          toId: p.conceptId,
          fromX: from.x + nodeWidth / 2 - 10,
          fromY: from.y,
          toX: to.x - nodeWidth / 2 + 10,
          toY: to.y,
          isRouteActive,
        };
      })
      .filter(Boolean) as Array<{
      fromId: string;
      toId: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      isRouteActive: boolean;
    }>;

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      canvasBounds: { width: maxX, height: maxY },
    };
  }, [concepts, prerequisites, learnerStates, prereqMap, activeRouteConceptIds]);

  // Selected inspecting topic details
  const inspectingConcept = useMemo(
    () => concepts.find((c) => c.id === inspectingConceptId) || null,
    [concepts, inspectingConceptId]
  );
  const inspectingState = inspectingConcept ? learnerStates.get(inspectingConcept.id) : null;
  const inspectingPrereqNames = useMemo(() => {
    if (!inspectingConcept) return [];
    const prereqIds = prereqMap.get(inspectingConcept.id) || [];
    return prereqIds.map((id) => concepts.find((c) => c.id === id)?.name || 'Prerequisite');
  }, [inspectingConcept, prereqMap, concepts]);

  const inspectingIsLocked = useMemo(() => {
    if (!inspectingConcept) return false;
    const node = nodes.find((n) => n.id === inspectingConcept.id);
    return node?.isLocked ?? false;
  }, [inspectingConcept, nodes]);

  const inspectingActivity = useMemo(() => {
    if (!inspectingConcept) return null;
    return activities.find((a) => a.conceptId === inspectingConcept.id) || null;
  }, [inspectingConcept, activities]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.map-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scale = Math.min(
      (clientWidth - 60) / canvasBounds.width,
      (clientHeight - 60) / canvasBounds.height,
      1.1
    );
    setZoom(Math.max(0.45, Number(scale.toFixed(2))));
    setPan({ x: 30, y: 30 });
  };

  // Filtered nodes for list view or search highlight
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = n.concept.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCluster =
        selectedClusterFilter === 'ALL' || n.cluster === selectedClusterFilter;
      return matchesSearch && matchesCluster;
    });
  }, [nodes, searchQuery, selectedClusterFilter]);

  // Handle node selection
  const handleNodeClick = (concept: Concept) => {
    setInspectingConceptId(concept.id);
    if (onSelectConcept) onSelectConcept(concept);
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 overflow-hidden shadow-xs">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-saffron-500/10 text-saffron-600 dark:text-saffron-400">
            <Compass size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <span>Your Learning Map</span>
              <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {concepts.length} Topics
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive roadmap to reach your goal. Click any topic to explore.
            </p>
          </div>
        </div>

        {/* Controls & Search */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative hidden sm:block">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a topic..."
              className="h-8 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500 w-36 lg:w-48"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          {/* Zoom controls (Map view only) */}
          {viewMode === 'map' && (
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fit to screen"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset View"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      {viewMode === 'map' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative h-[620px] w-full overflow-hidden select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Zoomable / Pannable SVG & Node Container */}
          <div
            className="absolute origin-top-left transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: `${canvasBounds.width}px`,
              height: `${canvasBounds.height}px`,
            }}
          >
            {/* SVG Connecting Edges */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasBounds.width}
              height={canvasBounds.height}
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="edge-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
                </marker>
                <marker
                  id="edge-arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ff9933" />
                </marker>
              </defs>

              {edges.map((edge, idx) => {
                const deltaX = edge.toX - edge.fromX;
                const c1X = edge.fromX + deltaX * 0.4;
                const c1Y = edge.fromY;
                const c2X = edge.toX - deltaX * 0.4;
                const c2Y = edge.toY;
                const pathData = `M ${edge.fromX} ${edge.fromY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${edge.toX} ${edge.toY}`;

                return (
                  <g key={idx}>
                    {/* Background glow if part of active route */}
                    {edge.isRouteActive && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#ff9933"
                        strokeWidth="5"
                        strokeOpacity="0.25"
                        className="animate-pulse"
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={edge.isRouteActive ? '#ff9933' : '#cbd5e1'}
                      strokeWidth={edge.isRouteActive ? '2.5' : '1.8'}
                      strokeDasharray={edge.isRouteActive ? 'none' : '4 4'}
                      markerEnd={edge.isRouteActive ? 'url(#edge-arrow-active)' : 'url(#edge-arrow)'}
                      className="transition-colors duration-300"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Topic Nodes */}
            {nodes.map((node) => {
              const isSelected = inspectingConceptId === node.id;
              const isMatch =
                !searchQuery ||
                node.concept.name.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.concept)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                  className={`map-node absolute rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border text-left ${
                    isSelected
                      ? 'ring-2 ring-saffron-500 shadow-lg scale-102 z-30'
                      : 'hover:shadow-md hover:scale-101 z-20'
                  } ${
                    node.isLocked
                      ? 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 opacity-75'
                      : node.status === 'MASTERED'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
                      : node.status === 'NEEDS_REVIEW'
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 animate-pulse'
                      : node.status === 'DEVELOPING'
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  } ${!isMatch ? 'opacity-30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xs uppercase tracking-wider font-bold text-slate-400 truncate">
                      {node.cluster}
                    </span>
                    {node.isLocked ? (
                      <Lock size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    ) : node.status === 'MASTERED' ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : node.status === 'NEEDS_REVIEW' ? (
                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock size={13} className="text-saffron-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                    {node.concept.name}
                  </div>

                  <div className="flex items-center justify-between text-3xs font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{formatLearnerState(node.status)}</span>
                    {node.score > 0 && <span>{node.score}%</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Minimap Overlay */}
          <LearningMapMinimap
            nodes={nodes}
            edges={edges}
            canvasBounds={canvasBounds}
            viewBox={{
              x: -pan.x / zoom,
              y: -pan.y / zoom,
              width: 800 / zoom,
              height: 600 / zoom,
            }}
            onNavigate={(targetX, targetY) => {
              setPan({
                x: 400 - targetX * zoom,
                y: 300 - targetY * zoom,
              });
            }}
          />
        </div>
      ) : (
        /* Linear Step-by-Step List View */
        <div className="p-6 space-y-4 max-h-[620px] overflow-y-auto">
          {filteredNodes.map((node, index) => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node.concept)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-3xs uppercase font-bold text-slate-400">
                    {node.cluster}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {node.concept.name}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {formatLearnerState(node.status)}
                </span>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-In Topic Detail Drawer */}
      <TopicDetailDrawer
        isOpen={inspectingConceptId !== null}
        onClose={() => setInspectingConceptId(null)}
        concept={inspectingConcept}
        state={inspectingState}
        prerequisiteNames={inspectingPrereqNames}
        isLocked={inspectingIsLocked}
        activity={inspectingActivity}
      />
    </div>
  );
}
