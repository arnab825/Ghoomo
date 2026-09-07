'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Concept,
  ConceptPrerequisite,
  LearnerConceptState,
  LearningActivity,
} from '@/lib/types/engine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Lock,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Search,
  ArrowRight,
  Sparkles,
  GitBranch,
  Brain,
} from 'lucide-react';
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
  roadmapTitle?: string;
  roadmapSubject?: string;
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
  phaseIndex: number;
  stepNumber: number;
  stepLabel: string;
}

interface StageMilestone {
  id: string;
  phaseIndex: number;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  masteredCount: number;
  conceptsCount: number;
}

interface PhaseContainer {
  index: number;
  title: string;
  topY: number;
  height: number;
  conceptsCount: number;
  masteredCount: number;
}

interface RoadmapEdge {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'milestone_entry' | 'intra_prereq' | 'flow_guide' | 'stage_transition';
  isRouteActive: boolean;
}

export default function KnowledgeGraphMap({
  concepts,
  prerequisites,
  learnerStates,
  activities = [],
  onSelectConcept,
  activeRouteConceptIds = [],
  roadmapTitle,
  roadmapSubject,
}: KnowledgeGraphMapProps) {
  // Drawer state
  const [inspectingConceptId, setInspectingConceptId] = useState<string | null>(null);
  const [hoveredConceptId, setHoveredConceptId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');

  // Knowledge Level Adaptation (Beginner, Intermediate, Difficult/Advanced, Auto, All)
  const [selectedLevel, setSelectedLevel] = useState<'auto' | 'beginner' | 'intermediate' | 'advanced' | 'all'>('auto');

  // Calculate distribution of concepts by difficulty
  const difficultyCounts = useMemo(() => {
    let beginner = 0;
    let intermediate = 0;
    let advanced = 0;
    concepts.forEach((c) => {
      const diff = (c.difficulty || 'beginner').toLowerCase();
      if (diff === 'advanced') advanced++;
      else if (diff === 'intermediate') intermediate++;
      else beginner++;
    });
    return { beginner, intermediate, advanced };
  }, [concepts]);

  // Real-time detection of user's active knowledge/competency level from their progression
  const userCurrentLevel = useMemo<'beginner' | 'intermediate' | 'advanced'>(() => {
    let hasAdv = false;
    let hasInt = false;
    for (const c of concepts) {
      const s = learnerStates.get(c.id);
      const isActiveOrDone = s && (s.state === 'DEVELOPING' || s.state === 'PROVISIONALLY_READY' || s.state === 'MASTERED');
      if (isActiveOrDone) {
        const diff = (c.difficulty || '').toLowerCase();
        if (diff === 'advanced') hasAdv = true;
        if (diff === 'intermediate') hasInt = true;
      }
    }
    if (hasAdv) return 'advanced';
    if (hasInt) return 'intermediate';
    return 'beginner';
  }, [concepts, learnerStates]);

  const activeEffectiveLevel = selectedLevel === 'auto' ? userCurrentLevel : selectedLevel;

  // Filtered concepts based on user knowledge level
  const displayedConcepts = useMemo(() => {
    if (activeEffectiveLevel === 'all') return concepts;
    return concepts.filter((c) => (c.difficulty || 'beginner').toLowerCase() === activeEffectiveLevel);
  }, [concepts, activeEffectiveLevel]);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Build direct prerequisite lookups
  const prereqMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of prerequisites) {
      if (!map.has(p.conceptId)) map.set(p.conceptId, []);
      map.get(p.conceptId)!.push(p.prerequisiteConceptId);
    }
    return map;
  }, [prerequisites]);

  const dependentMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of prerequisites) {
      if (!map.has(p.prerequisiteConceptId)) map.set(p.prerequisiteConceptId, []);
      map.get(p.prerequisiteConceptId)!.push(p.conceptId);
    }
    return map;
  }, [prerequisites]);

  // Set of connected concept IDs for the hovered node
  const activeFocusIds = useMemo(() => {
    if (!hoveredConceptId && !inspectingConceptId) return null;
    const targetId = hoveredConceptId || inspectingConceptId!;
    const ids = new Set<string>([targetId]);
    
    // Immediate prerequisites
    const prereqs = prereqMap.get(targetId) || [];
    prereqs.forEach((id) => ids.add(id));

    // Immediate dependents
    const dependents = dependentMap.get(targetId) || [];
    dependents.forEach((id) => ids.add(id));

    return ids;
  }, [hoveredConceptId, inspectingConceptId, prereqMap, dependentMap]);

  // Calculate clean, unconfusing topological learning path
  const { nodes, edges, milestones, phaseContainers, canvasBounds } = useMemo(() => {
    if (displayedConcepts.length === 0) {
      return {
        nodes: [],
        edges: [],
        milestones: [],
        phaseContainers: [],
        canvasBounds: { width: 1040, height: 800 },
      };
    }

    const CANVAS_WIDTH = 1040;
    const CENTER_X = CANVAS_WIDTH / 2; // 520
    const NODE_W = 320;
    const NODE_H = 120;
    const GAP_X = 60;
    const LAYER_GAP_Y = 55;
    const MILESTONE_W = 460;
    const MILESTONE_H = 42;

    // 1. Sort concepts by orderIndex
    const sortedConcepts = [...displayedConcepts].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.name.localeCompare(b.name);
    });

    // 2. Partition into logical stages (adapts to level)
    const phaseCount =
      activeEffectiveLevel === 'all'
        ? Math.min(5, Math.max(3, Math.ceil(sortedConcepts.length / 5)))
        : Math.min(3, Math.max(1, Math.ceil(sortedConcepts.length / 6)));

    const itemsPerPhase = Math.ceil(sortedConcepts.length / phaseCount);

    const phases: Concept[][] = [];
    for (let i = 0; i < phaseCount; i++) {
      const slice = sortedConcepts.slice(i * itemsPerPhase, (i + 1) * itemsPerPhase);
      if (slice.length > 0) phases.push(slice);
    }

    let defaultPhaseNames = [
      'Foundations & Core Mechanics',
      'Data Structures & Implementation',
      'Algorithmic Patterns & Logic',
      'Advanced Optimization & Systems',
      'Capstone Projects & Mastery',
    ];

    if (activeEffectiveLevel === 'beginner') {
      defaultPhaseNames = [
        'Stage 01: Core Foundations & Relational Model',
        'Stage 02: Essential SQL Syntax & Table Design',
      ];
    } else if (activeEffectiveLevel === 'intermediate') {
      defaultPhaseNames = [
        'Stage 01: Query Engineering, Aggregations & JOINs',
        'Stage 02: Transactions, Schema Normalization & Security',
      ];
    } else if (activeEffectiveLevel === 'advanced') {
      defaultPhaseNames = [
        'Stage 01: Query Plan Optimization & Concurrency',
        'Stage 02: Distributed Scale, Sharding & Caching',
      ];
    }

    const layoutNodes: NodeLayout[] = [];
    const layoutEdges: RoadmapEdge[] = [];
    const stageMilestones: StageMilestone[] = [];
    const containers: PhaseContainer[] = [];
    const nodeCoords = new Map<string, { x: number; y: number; w: number; h: number }>();

    let currentY = 50;
    let globalStepCounter = 1;

    // Store layer information for connecting clean inter-stage flow
    const stageLayerNodes: NodeLayout[][][] = [];

    phases.forEach((phaseConcepts, pIdx) => {
      const phaseTitle = defaultPhaseNames[pIdx] || `Stage 0${pIdx + 1}: Core Competencies`;
      const phaseConceptIds = new Set(phaseConcepts.map((c) => c.id));

      // Calculate mastered count in this phase
      let phaseMastered = 0;
      phaseConcepts.forEach((c) => {
        const s = learnerStates.get(c.id);
        if (s?.state === 'MASTERED') phaseMastered++;
      });

      // Filter intra-stage prerequisites (prerequisites within THIS stage)
      const intraPrereqs = prerequisites.filter(
        (pr) => phaseConceptIds.has(pr.conceptId) && phaseConceptIds.has(pr.prerequisiteConceptId)
      );

      // 1. Milestone Banner sits directly centered on the spine
      const milestoneY = currentY;
      const milestoneId = `milestone-${pIdx}`;
      stageMilestones.push({
        id: milestoneId,
        phaseIndex: pIdx,
        title: phaseTitle,
        subtitle: `Stage ${pIdx + 1} of ${phases.length}`,
        x: CENTER_X - MILESTONE_W / 2,
        y: milestoneY,
        width: MILESTONE_W,
        height: MILESTONE_H,
        masteredCount: phaseMastered,
        conceptsCount: phaseConcepts.length,
      });

      currentY += MILESTONE_H + 45;
      const stageStartY = currentY - 15;

      // 2. Compute clean topological layers within this stage
      let stageLayers: Concept[][] = [];

      if (intraPrereqs.length === 0) {
        // No explicit intra-stage prereqs: clean sequential 1 or 2 per row
        for (let i = 0; i < phaseConcepts.length; i += 2) {
          stageLayers.push(phaseConcepts.slice(i, i + 2));
        }
      } else {
        const parentMap = new Map<string, string[]>();
        intraPrereqs.forEach((pr) => {
          if (!parentMap.has(pr.conceptId)) parentMap.set(pr.conceptId, []);
          parentMap.get(pr.conceptId)!.push(pr.prerequisiteConceptId);
        });

        const ranks = new Map<string, number>();
        phaseConcepts.forEach((c) => ranks.set(c.id, 0));

        let changed = true;
        let iter = 0;
        while (changed && iter < 10) {
          changed = false;
          iter++;
          phaseConcepts.forEach((c) => {
            const parents = parentMap.get(c.id) || [];
            parents.forEach((pId) => {
              const pRank = ranks.get(pId) || 0;
              if ((ranks.get(c.id) || 0) <= pRank) {
                ranks.set(c.id, pRank + 1);
                changed = true;
              }
            });
          });
        }

        const maxRank = Math.max(...Array.from(ranks.values()), 0);
        for (let r = 0; r <= maxRank; r++) {
          const inRank = phaseConcepts.filter((c) => ranks.get(c.id) === r);
          if (inRank.length > 2) {
            for (let i = 0; i < inRank.length; i += 2) {
              stageLayers.push(inRank.slice(i, i + 2));
            }
          } else if (inRank.length > 0) {
            stageLayers.push(inRank);
          }
        }
      }

      const thisStageLayoutLayers: NodeLayout[][] = [];

      // 3. Layout each layer horizontally centered
      stageLayers.forEach((layerConcepts, lIdx) => {
        const layerY = currentY;
        const currentLayerNodes: NodeLayout[] = [];

        if (layerConcepts.length === 1) {
          // Single centered card
          const concept = layerConcepts[0];
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

          const nodeLayout: NodeLayout = {
            id: concept.id,
            concept,
            x: CENTER_X - NODE_W / 2,
            y: layerY,
            width: NODE_W,
            height: NODE_H,
            cluster: phaseTitle,
            status,
            isLocked,
            score: stateObj?.score || 0,
            phaseIndex: pIdx,
            stepNumber: globalStepCounter,
            stepLabel: `${pIdx + 1}.${globalStepCounter}`,
          };

          globalStepCounter++;
          layoutNodes.push(nodeLayout);
          currentLayerNodes.push(nodeLayout);
          nodeCoords.set(concept.id, { x: nodeLayout.x, y: nodeLayout.y, w: NODE_W, h: NODE_H });
        } else {
          // Two cards symmetrically placed (Left and Right of central spine)
          const xLeft = CENTER_X - NODE_W - GAP_X / 2;
          const xRight = CENTER_X + GAP_X / 2;

          layerConcepts.forEach((concept, cIdx) => {
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

            const nodeX = cIdx === 0 ? xLeft : xRight;
            const nodeLayout: NodeLayout = {
              id: concept.id,
              concept,
              x: nodeX,
              y: layerY,
              width: NODE_W,
              height: NODE_H,
              cluster: phaseTitle,
              status,
              isLocked,
              score: stateObj?.score || 0,
              phaseIndex: pIdx,
              stepNumber: globalStepCounter,
              stepLabel: `${pIdx + 1}.${globalStepCounter}`,
            };

            globalStepCounter++;
            layoutNodes.push(nodeLayout);
            currentLayerNodes.push(nodeLayout);
            nodeCoords.set(concept.id, { x: nodeLayout.x, y: nodeLayout.y, w: NODE_W, h: NODE_H });
          });
        }

        thisStageLayoutLayers.push(currentLayerNodes);
        currentY += NODE_H + LAYER_GAP_Y;
      });

      stageLayerNodes.push(thisStageLayoutLayers);

      // Record stage container bounding box
      containers.push({
        index: pIdx,
        title: phaseTitle,
        topY: stageStartY,
        height: currentY - stageStartY - LAYER_GAP_Y + 25,
        conceptsCount: phaseConcepts.length,
        masteredCount: phaseMastered,
      });

      // Extra breathing room before next milestone
      currentY += 45;
    });

    // 4. Generate Clean, Non-Intersecting Edges
    phases.forEach((_, pIdx) => {
      const stageLayers = stageLayerNodes[pIdx] || [];
      const milestone = stageMilestones[pIdx];

      // A. Connect Stage Milestone to Layer 0 entry nodes
      if (milestone && stageLayers.length > 0) {
        const firstLayer = stageLayers[0];
        firstLayer.forEach((node) => {
          layoutEdges.push({
            fromId: milestone.id,
            toId: node.id,
            fromX: CENTER_X,
            fromY: milestone.y + milestone.height,
            toX: node.x + node.width / 2,
            toY: node.y,
            type: 'milestone_entry',
            isRouteActive: activeRouteConceptIds.includes(node.id),
          });
        });
      }

      // B. Connect previous stage's exit nodes into this Stage Milestone
      if (pIdx > 0 && milestone) {
        const prevStageLayers = stageLayerNodes[pIdx - 1] || [];
        if (prevStageLayers.length > 0) {
          const lastLayer = prevStageLayers[prevStageLayers.length - 1];
          lastLayer.forEach((node) => {
            layoutEdges.push({
              fromId: node.id,
              toId: milestone.id,
              fromX: node.x + node.width / 2,
              fromY: node.y + node.height,
              toX: CENTER_X,
              toY: milestone.y,
              type: 'stage_transition',
              isRouteActive: activeRouteConceptIds.includes(node.id),
            });
          });
        }
      }

      // C. Intra-stage connections layer-by-layer
      for (let l = 0; l < stageLayers.length - 1; l++) {
        const upperLayer = stageLayers[l];
        const lowerLayer = stageLayers[l + 1];

        // First find if there are explicit prerequisites from upperLayer to lowerLayer
        const lowerConnected = new Set<string>();

        lowerLayer.forEach((lowerNode) => {
          const lowerPrereqs = prereqMap.get(lowerNode.id) || [];
          upperLayer.forEach((upperNode) => {
            if (lowerPrereqs.includes(upperNode.id)) {
              layoutEdges.push({
                fromId: upperNode.id,
                toId: lowerNode.id,
                fromX: upperNode.x + upperNode.width / 2,
                fromY: upperNode.y + upperNode.height,
                toX: lowerNode.x + lowerNode.width / 2,
                toY: lowerNode.y,
                type: 'intra_prereq',
                isRouteActive:
                  activeRouteConceptIds.includes(upperNode.id) &&
                  activeRouteConceptIds.includes(lowerNode.id),
              });
              lowerConnected.add(lowerNode.id);
            }
          });
        });

        // For any lowerNode without an explicit prerequisite from upperLayer,
        // create a clean sequential flow guide from the nearest upper node
        lowerLayer.forEach((lowerNode) => {
          if (!lowerConnected.has(lowerNode.id)) {
            // Find best matching upper parent
            let parentNode = upperLayer[0];
            if (upperLayer.length === 2 && lowerLayer.length === 2) {
              // Left connects to Left, Right connects to Right
              parentNode = lowerNode.x < CENTER_X ? upperLayer[0] : upperLayer[1];
            } else if (upperLayer.length > 1) {
              parentNode = upperLayer.reduce((closest, candidate) => {
                const dCandidate = Math.abs(candidate.x + candidate.width / 2 - (lowerNode.x + lowerNode.width / 2));
                const dClosest = Math.abs(closest.x + closest.width / 2 - (lowerNode.x + lowerNode.width / 2));
                return dCandidate < dClosest ? candidate : closest;
              }, upperLayer[0]);
            }

            layoutEdges.push({
              fromId: parentNode.id,
              toId: lowerNode.id,
              fromX: parentNode.x + parentNode.width / 2,
              fromY: parentNode.y + parentNode.height,
              toX: lowerNode.x + lowerNode.width / 2,
              toY: lowerNode.y,
              type: 'flow_guide',
              isRouteActive:
                activeRouteConceptIds.includes(parentNode.id) &&
                activeRouteConceptIds.includes(lowerNode.id),
            });
          }
        });
      }
    });

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      milestones: stageMilestones,
      phaseContainers: containers,
      canvasBounds: { width: CANVAS_WIDTH, height: Math.max(800, currentY + 60) },
    };
  }, [displayedConcepts, activeEffectiveLevel, prerequisites, learnerStates, prereqMap, activeRouteConceptIds]);

  // Center canvas horizontally
  const centerCanvas = useCallback((scale = zoom) => {
    if (containerRef.current) {
      const clientW = containerRef.current.clientWidth;
      const centeredX = Math.round((clientW - canvasBounds.width * scale) / 2);
      setPan({ x: Math.max(20, centeredX), y: 30 });
    }
  }, [canvasBounds.width, zoom]);

  useEffect(() => {
    centerCanvas(zoom);
  }, [canvasBounds.width, centerCanvas, zoom]);

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

  // Pointer drag handlers for silky-smooth manual pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.map-node') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore browsers that do not support pointer capture
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore pointer release errors
      }
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(1.8, Math.max(0.4, Number((prevZoom * zoomFactor).toFixed(2))));
      return nextZoom;
    });
  };

  // Zoom button handlers
  const handleZoomIn = () => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(0.85);
    centerCanvas(0.85);
  };

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scale = Math.min(
      (clientWidth - 60) / canvasBounds.width,
      (clientHeight - 80) / canvasBounds.height,
      1.0
    );
    const newZoom = Math.max(0.4, Number(scale.toFixed(2)));
    setZoom(newZoom);
    centerCanvas(newZoom);
  };

  // Filtered nodes for search
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      return !searchQuery || n.concept.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [nodes, searchQuery]);

  const handleNodeClick = (concept: Concept) => {
    setInspectingConceptId(concept.id);
    if (onSelectConcept) onSelectConcept(concept);
  };

  // Summary stats for legend
  const stats = useMemo(() => {
    let mastered = 0;
    let inProgress = 0;
    let locked = 0;
    let ready = 0;
    nodes.forEach((n) => {
      if (n.status === 'MASTERED') mastered++;
      else if (n.status === 'DEVELOPING' || n.status === 'PROVISIONALLY_READY') inProgress++;
      else if (n.isLocked) locked++;
      else ready++;
    });
    return { mastered, inProgress, locked, ready };
  }, [nodes]);

  return (
    <div className="relative w-full max-w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs select-none">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-slate-50 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-saffron-500/15 text-saffron-600 dark:text-saffron-400 border border-saffron-500/20">
                Official Curriculum Path
              </span>
              <span className="text-2xs font-bold text-slate-400">
                {roadmapSubject || 'Computer Science'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{roadmapTitle || 'Curriculum Roadmap'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Follow this crystal-clear learning path. Topics flow sequentially from fundamental concepts down into specialized mastery. Hover or click any topic to trace its exact dependencies.
            </p>
          </div>

          {/* View Toggle & Canvas Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Compass size={14} />
                <span>Roadmap Flow</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>Curriculum Tracks</span>
              </button>
            </div>

            {viewMode === 'map' && (
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleFitToScreen}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fit to Screen"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Center & Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Level Adaptation Toolbar (Beginner, Intermediate, Difficult, My Level) */}
        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mr-1">
              <Brain size={15} className="text-saffron-500" />
              <span>Tailor Path:</span>
            </div>

            <div className="flex flex-wrap items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedLevel('auto')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLevel === 'auto'
                    ? 'bg-white dark:bg-slate-800 text-saffron-600 dark:text-saffron-400 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Automatically adapts to your active topic proficiency"
              >
                <Sparkles size={13} className="text-saffron-500" />
                <span>My Level ({userCurrentLevel.toUpperCase()})</span>
                <span className="h-1.5 w-1.5 rounded-full bg-saffron-500 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel('beginner')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLevel === 'beginner'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Beginner</span>
                <span className="text-3xs px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 font-mono">
                  {difficultyCounts.beginner}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel('intermediate')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLevel === 'intermediate'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Intermediate</span>
                <span className="text-3xs px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 font-mono">
                  {difficultyCounts.intermediate}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel('advanced')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLevel === 'advanced'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Difficult / Advanced</span>
                <span className="text-3xs px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 font-mono">
                  {difficultyCounts.advanced}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel('all')}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedLevel === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs ring-1 ring-black/5'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>All Stages</span>
                <span className="text-3xs px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700 font-mono">
                  {concepts.length}
                </span>
              </button>
            </div>
          </div>

          {/* Adaptive Explainer Badge */}
          <div className="flex items-center gap-1.5 text-2xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
            <span>
              {activeEffectiveLevel === 'beginner'
                ? 'Simplified for Foundations: Showing beginner core principles without clutter.'
                : activeEffectiveLevel === 'intermediate'
                ? 'Simplified for Intermediate: Skipping basics, focusing on query engineering & logic.'
                : activeEffectiveLevel === 'advanced'
                ? 'Simplified for Advanced: Focusing on query execution plans, sharding & systems.'
                : 'Full Curriculum: Showing complete multi-stage roadmap end-to-end.'}
            </span>
          </div>
        </div>

        {/* Legend Bar & Search */}
        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xs uppercase font-bold text-slate-400 tracking-wider">Legend:</span>

            {/* In Progress */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600 font-bold text-amber-900 dark:text-amber-200 text-3xs">
              <span className="h-2 w-2 rounded-full bg-saffron-500 animate-pulse" />
              <span>In Progress ({stats.inProgress})</span>
            </div>

            {/* Mastered */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-600 font-bold text-emerald-800 dark:text-emerald-300 text-3xs">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Mastered ({stats.mastered})</span>
            </div>

            {/* Ready */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 text-3xs">
              <Clock size={12} className="text-saffron-500" />
              <span>Ready ({stats.ready})</span>
            </div>

            {/* Locked */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 font-semibold text-slate-500 dark:text-slate-400 text-3xs">
              <Lock size={12} />
              <span>Locked ({stats.locked})</span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-saffron-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      {viewMode === 'map' ? (
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative w-full h-175 overflow-hidden bg-slate-50/50 dark:bg-slate-950 cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Zoom Level Indicator */}
          <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-lg bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs border border-slate-200 dark:border-slate-800 text-3xs font-bold text-slate-500 dark:text-slate-400 shadow-xs pointer-events-none">
            {Math.round(zoom * 100)}%
          </div>

          {/* Canvas Viewport */}
          <div
            className="absolute origin-top-left transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: `${canvasBounds.width}px`,
              height: `${canvasBounds.height}px`,
            }}
          >
            {/* 1. Stage Boundary Containers */}
            {phaseContainers.map((container) => (
              <div
                key={`container-stage-${container.index}`}
                style={{
                  left: '60px',
                  top: `${container.topY}px`,
                  width: '920px',
                  height: `${container.height}px`,
                }}
                className="absolute rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-slate-100/30 dark:bg-slate-900/25 pointer-events-none"
              />
            ))}

            {/* 2. Clean, Non-Intersecting SVG Connector Lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasBounds.width}
              height={canvasBounds.height}
            >
              <defs>
                <marker
                  id="flow-arrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                </marker>
                <marker
                  id="flow-arrow-active"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="flow-arrow-downstream"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>

              {edges.map((edge, idx) => {
                const isHoverFocus =
                  activeFocusIds !== null &&
                  activeFocusIds.has(edge.fromId) &&
                  activeFocusIds.has(edge.toId);

                const isUpstream =
                  (hoveredConceptId === edge.toId || inspectingConceptId === edge.toId) &&
                  (prereqMap.get(edge.toId) || []).includes(edge.fromId);

                const isDownstream =
                  (hoveredConceptId === edge.fromId || inspectingConceptId === edge.fromId) &&
                  (dependentMap.get(edge.fromId) || []).includes(edge.toId);

                // Smooth S-curve or direct vertical line
                let pathData: string;
                if (Math.abs(edge.fromX - edge.toX) < 5) {
                  // Direct vertical line
                  pathData = `M ${edge.fromX} ${edge.fromY} L ${edge.toX} ${edge.toY}`;
                } else {
                  // Clean smooth vertical bezier curve
                  const deltaY = edge.toY - edge.fromY;
                  const cY1 = edge.fromY + deltaY * 0.5;
                  const cY2 = edge.toY - deltaY * 0.5;
                  pathData = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${cY1}, ${edge.toX} ${cY2}, ${edge.toX} ${edge.toY}`;
                }

                // Determine stroke color and style
                let strokeColor = '#94a3b8';
                let strokeWidth = '2';
                let markerId = 'url(#flow-arrow)';
                let strokeDash = 'none';

                if (edge.type === 'stage_transition' || edge.type === 'milestone_entry') {
                  strokeColor = '#64748b';
                  strokeWidth = '2.5';
                }

                if (edge.type === 'flow_guide') {
                  strokeDash = '4 4';
                  strokeColor = '#cbd5e1';
                }

                if (edge.isRouteActive) {
                  strokeColor = '#f59e0b';
                  strokeWidth = '3';
                  strokeDash = 'none';
                  markerId = 'url(#flow-arrow-active)';
                }

                if (isHoverFocus) {
                  strokeDash = 'none';
                  if (isUpstream) {
                    strokeColor = '#f59e0b';
                    strokeWidth = '4';
                    markerId = 'url(#flow-arrow-active)';
                  } else if (isDownstream) {
                    strokeColor = '#0ea5e9';
                    strokeWidth = '4';
                    markerId = 'url(#flow-arrow-downstream)';
                  } else {
                    strokeColor = '#f59e0b';
                    strokeWidth = '3';
                  }
                }

                return (
                  <g key={`edge-${idx}-${edge.fromId}-${edge.toId}`}>
                    {/* Glowing background under active/hovered edge */}
                    {(isHoverFocus || edge.isRouteActive) && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isUpstream ? '#f59e0b' : isDownstream ? '#0ea5e9' : '#f59e0b'}
                        strokeWidth="6"
                        strokeOpacity="0.25"
                        className="animate-pulse"
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={markerId}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}
            </svg>

            {/* 3. Stage Milestones (Clean horizontal pill headers, never crossed by lines) */}
            {milestones.map((m) => (
              <div
                key={`milestone-stage-${m.phaseIndex}`}
                style={{
                  left: `${m.x}px`,
                  top: `${m.y}px`,
                  width: `${m.width}px`,
                  height: `${m.height}px`,
                }}
                className="absolute z-20 rounded-full px-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border border-slate-700 shadow-md flex items-center justify-between pointer-events-auto select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xs font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    STAGE 0{m.phaseIndex + 1}
                  </span>
                  <span className="text-xs font-bold truncate text-white">
                    {m.title}
                  </span>
                </div>
                <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0 border border-slate-700">
                  {m.masteredCount}/{m.conceptsCount} Done
                </span>
              </div>
            ))}

            {/* 4. Topic Cards (Structured, clean, and crystal clear) */}
            {nodes.map((node) => {
              const isSelected = inspectingConceptId === node.id;
              const isHovered = hoveredConceptId === node.id;
              const isMatch =
                !searchQuery ||
                node.concept.name.toLowerCase().includes(searchQuery.toLowerCase());

              const isDimmed = searchQuery
                ? !isMatch
                : activeFocusIds !== null && !activeFocusIds.has(node.id);

                const isProgress = node.status === 'DEVELOPING' || node.status === 'PROVISIONALLY_READY';
                const isMastered = node.status === 'MASTERED';
                const isNeedsReview = node.status === 'NEEDS_REVIEW';
                const isLocked = node.isLocked;

                let cardBgBorder = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-saffron-500 text-slate-900 dark:text-white shadow-xs';
                if (isProgress) {
                  cardBgBorder = 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-500/10 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/40';
                } else if (isMastered) {
                  cardBgBorder = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 shadow-xs';
                } else if (isNeedsReview) {
                  cardBgBorder = 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-100 animate-pulse';
                } else if (isLocked) {
                  cardBgBorder = 'bg-slate-50 dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-xs';
                }

                return (
                  <div
                    key={`map-node-${node.id}`}
                    onClick={() => handleNodeClick(node.concept)}
                    onMouseEnter={() => setHoveredConceptId(node.id)}
                    onMouseLeave={() => setHoveredConceptId(null)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                    }}
                    className={`map-node absolute rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-150 border-2 select-none z-20 ${cardBgBorder} ${
                      isSelected || isHovered ? 'scale-103 shadow-lg ring-2 ring-saffron-500 z-30' : 'hover:scale-101 hover:shadow-md'
                    } ${isDimmed ? 'opacity-35 scale-98' : 'opacity-100'}`}
                  >
                    {/* Top Header: Step Badge & Status Pill */}
                    <div className="flex items-center justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 font-mono text-3xs font-extrabold text-slate-800 dark:text-slate-200">
                          {node.stepLabel}
                        </span>
                        <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {node.concept.difficulty || 'Core'}
                        </span>
                      </div>

                      {isLocked ? (
                        <span className="flex items-center gap-1 text-3xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          <Lock size={11} />
                          <span>Locked</span>
                        </span>
                      ) : isMastered ? (
                        <span className="flex items-center gap-1 text-3xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 size={12} />
                          <span>Mastered</span>
                        </span>
                      ) : isProgress ? (
                        <span className="flex items-center gap-1 text-3xs font-extrabold px-1.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200 shrink-0">
                          <Clock size={10} />
                          <span>In Progress</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-3xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                          <span>Ready</span>
                        </span>
                      )}
                    </div>

                    {/* Prominent Concept Title (Always clearly visible with high contrast) */}
                    <div className="flex-1 min-h-[44px] flex items-center my-0.5">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {node.concept.name}
                      </span>
                    </div>

                    {/* Bottom Footer: Learner status & Explore link */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-black/10 dark:border-white/10 text-3xs shrink-0">
                      <span className="font-medium text-slate-500 dark:text-slate-400 truncate">
                        {formatLearnerState(node.status)}
                      </span>
                      <span className="text-saffron-600 dark:text-saffron-400 font-bold flex items-center gap-0.5 shrink-0">
                        <span>Explore</span>
                        <ArrowRight size={10} />
                      </span>
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
              width: (containerRef.current?.clientWidth || 800) / zoom,
              height: 600 / zoom,
            }}
            onNavigate={(targetX, targetY) => {
              const clientW = containerRef.current?.clientWidth || 800;
              setPan({
                x: clientW / 2 - targetX * zoom,
                y: 300 - targetY * zoom,
              });
            }}
          />
        </div>
      ) : (
        /* Structured Curriculum Tracks (Roadmap.sh Chapter View) */
        <div className="p-6 space-y-6 max-h-180 overflow-y-auto">
          {milestones.map((m) => {
            const phaseConcepts = filteredNodes.filter((n) => n.phaseIndex === m.phaseIndex);
            if (phaseConcepts.length === 0) return null;

            const progressPct =
              m.conceptsCount > 0
                ? Math.round((m.masteredCount / m.conceptsCount) * 100)
                : 0;

            return (
              <div
                key={`track-stage-${m.phaseIndex}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4"
              >
                {/* Phase Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-3xs font-extrabold uppercase tracking-wider text-saffron-600 dark:text-saffron-400">
                      Stage 0{m.phaseIndex + 1}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                      {m.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-28 sm:w-36 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-10 text-right">
                      {progressPct}%
                    </span>
                  </div>
                </div>

                {/* Concepts Grid within Phase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phaseConcepts.map((node, cIdx) => (
                    <div
                      key={`track-node-${node.id}`}
                      onClick={() => handleNodeClick(node.concept)}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                          {cIdx + 1}
                        </span>
                        <span
                          className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                            node.status === 'MASTERED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : node.status === 'DEVELOPING'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : node.isLocked
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          }`}
                        >
                          {formatLearnerState(node.status)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                          {node.concept.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {node.concept.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-3xs text-slate-400">
                        <span className="capitalize">{node.concept.difficulty}</span>
                        <span className="text-saffron-500 font-bold flex items-center gap-1">
                          View details <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
