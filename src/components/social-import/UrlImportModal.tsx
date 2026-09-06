'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { tripService } from '@/lib/services/tripService';
import { Button } from '@/components/ui/button';
import {
  X,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight,
  Loader2,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Video,
  Eye,
  Type,
  Music,
  Compass,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TRIP_KEYS } from '@/hooks/useTripQueries';
import { useAuthStore } from '@/stores/useAuthStore';
import { SAMPLE_REELS_CATALOG, SampleReel } from '@/lib/video-pipeline/sampleReelsCatalog';

interface UrlImportModalProps {
  tripId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tripId: string) => void;
  initialUrl?: string;
}

const PIPELINE_STAGES = [
  { key: 'DOWNLOADING', label: 'Video stream received & cached' },
  { key: 'PROCESSING_VIDEO', label: 'Multimodal AI analyzing audio & visuals' },
  { key: 'EXTRACTING_EVIDENCE', label: 'Extracting landmarks, signs & OCR text' },
  { key: 'RESOLVING_DESTINATION', label: 'Resolving destination & entity coordinates' },
  { key: 'OPTIMIZING_TRIP', label: 'Geo-clustering & nearest-neighbor scheduling' },
  { key: 'GENERATING_ITINERARY', label: 'Generating structured itinerary with provenance' },
  { key: 'VALIDATING', label: 'Deterministic validation, budget & checklist' },
];

export default function UrlImportModal({
  tripId,
  isOpen,
  onClose,
  onSuccess,
  initialUrl = '',
}: UrlImportModalProps) {
  const queryClient = useQueryClient();
  const { currentUser, deductCredits } = useAuthStore();
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('IDLE');
  const [currentStageMessage, setCurrentStageMessage] = useState<string>('');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [candidateDestinations, setCandidateDestinations] = useState<Array<{ name: string; confidence: number; country?: string }>>([]);
  const [mounted, setMounted] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Sync initialUrl whenever it changes or modal opens
  useEffect(() => {
    if (isOpen && initialUrl && initialUrl.trim()) {
      setUrl(initialUrl.trim());
      setError(null);
    }
  }, [isOpen, initialUrl]);

  const handleClose = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setIsLoading(false);
    setError(null);
    setActiveJobId(null);
    setJobStatus('IDLE');
    setCompletedStages([]);
    setCandidateDestinations([]);
    onClose();
  };

  const startJobPolling = (jobId: string) => {
    setActiveJobId(jobId);
    setIsLoading(true);
    setError(null);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        setJobStatus(data.status);
        setCurrentStageMessage(data.message || '');

        // Update completed stages
        const stageOrder = PIPELINE_STAGES.map((s) => s.key);
        const currentIdx = stageOrder.indexOf(data.status);
        if (currentIdx >= 0) {
          setCompletedStages(stageOrder.slice(0, currentIdx));
        }

        // Low confidence / seasonal recommendation candidates
        if (data.status === 'NEEDS_CONFIRMATION') {
          setCandidateDestinations(data.destination_candidates || []);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          return;
        }

        // Success: READY
        if (data.status === 'READY') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setCompletedStages(stageOrder);
          deductCredits(1);

          // Save trip into client store
          if (data.trip) {
            tripService.saveLocalTrip(data.trip);
            queryClient.setQueryData(TRIP_KEYS.detail(data.trip.id), data.trip);
            queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
          }

          setIsLoading(false);
          const targetTripId = data.trip?.id || tripId;
          if (onSuccess && targetTripId) {
            onSuccess(targetTripId);
          } else if (targetTripId && typeof window !== 'undefined') {
            window.location.href = `/trips/${targetTripId}`;
          }
          onClose();
        }

        // Failure
        if (data.status === 'FAILED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsLoading(false);
          setError(data.error || 'Video could not be processed. Try a public video URL.');
        }
      } catch (pollErr) {
        console.warn('[UrlImportModal] Polling error:', pollErr);
      }
    }, 1200);
  };

  const handleStartExtraction = async (targetUrl?: string) => {
    const importUrl = (targetUrl || url).trim();
    if (!importUrl) {
      setError('Please enter a link to an Instagram Reel, YouTube Short, or travel video.');
      return;
    }

    if ((currentUser.credits ?? 9) < 1) {
      setError('You need 1 credit to extract places from a travel link. Please top up your credits.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCompletedStages([]);
    setCandidateDestinations([]);
    setJobStatus('DOWNLOADING');
    setCurrentStageMessage('Initiating video ingestion...');

    try {
      const res = await fetch('/api/trips/from-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: importUrl,
          preferences: {
            pace: 'balanced',
            travellers: 2,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.job_id) {
        throw new Error(data.error || 'Failed to initialize video processing.');
      }

      startJobPolling(data.job_id);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Unable to start video processing.');
    }
  };

  const handleConfirmDestination = async (chosenDestination: string) => {
    if (!activeJobId) return;
    setIsLoading(true);
    setCandidateDestinations([]);

    try {
      const res = await fetch(`/api/jobs/${activeJobId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: chosenDestination }),
      });

      if (!res.ok) {
        throw new Error('Failed to confirm destination.');
      }

      startJobPolling(activeJobId);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to confirm destination.');
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      style={{ zIndex: 99999 }}
      onClick={handleClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-saffron-500/20 to-teal-500/20 text-saffron-600 border border-saffron-500/30 shrink-0">
              <Video size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-heading">
                Turn Travel Video <span className="bg-linear-to-r from-saffron-500 to-teal-600 bg-clip-text text-transparent">→ Optimized Itinerary</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Native multimodal understanding across visuals, landmarks, OCR text, audio & duration.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input & Action */}
        {!isLoading && candidateDestinations.length === 0 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Public Travel Reel, Short, or Video URL
                </label>
                <span className="text-[11px] font-semibold text-saffron-600 dark:text-saffron-400 bg-saffron-500/10 px-2 py-0.5 rounded-sm border border-saffron-500/20">
                  1 AI Credit
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleStartExtraction();
                      }
                    }}
                    placeholder="Paste Instagram Reel, YouTube Short, or TikTok link..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                  />
                </div>
                <Button
                  onClick={() => handleStartExtraction()}
                  disabled={!url.trim()}
                  className="bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg enabled:cursor-pointer disabled:cursor-not-allowed shadow-md shrink-0"
                >
                  <span>Build Trip</span>
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Quick-Test Reel Archetypes Catalog */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-saffron-500" />
                  Try Tested Video Archetypes (Instant Demo):
                </span>
                <span className="text-[10px] text-slate-400">Click any card to select</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_REELS_CATALOG.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setUrl(sample.url);
                      setError(null);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-saffron-500/50 bg-slate-50/70 hover:bg-saffron-50/40 dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-saffron-500/50 text-left transition-all group enabled:cursor-pointer disabled:cursor-not-allowed"
                  >
                    <img
                      src={sample.thumbnailUrl}
                      alt={sample.title}
                      className="w-12 h-12 rounded-md object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-saffron-600 dark:text-saffron-400">
                        {sample.archetype === 'music_only_montage' && <Music size={10} />}
                        {sample.archetype === 'text_only_reel' && <Type size={10} />}
                        {sample.archetype === 'seasonal_recommendation' && <Calendar size={10} />}
                        <span>{sample.category}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sample.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {sample.tagline}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Candidate Destination Confirmation UI (Section 10C & 36) */}
        {candidateDestinations.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                <Compass size={15} className="text-amber-600 shrink-0" />
                <span>Multiple Destination Candidates Detected</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                This travel video recommends several distinct destinations. Select which one you would like Ghoomo to build into your itinerary:
              </p>
            </div>

            <div className="space-y-2">
              {candidateDestinations.map((cand, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-saffron-500 bg-white dark:bg-slate-900 dark:border-slate-800 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-saffron-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{cand.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {cand.country ? `Country: ${cand.country}` : 'Verified Destination'} • {Math.round(cand.confidence * 100)}% match
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConfirmDestination(cand.name)}
                    className="bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md enabled:cursor-pointer disabled:cursor-not-allowed"
                  >
                    Select This
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Multi-Stage Progress State (Section 49) */}
        {isLoading && candidateDestinations.length === 0 && (
          <div className="space-y-4 py-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-semibold">
                <Loader2 size={15} className="animate-spin text-saffron-500 shrink-0" />
                <span>{currentStageMessage || 'Processing travel video...'}</span>
              </div>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                {jobStatus}
              </span>
            </div>

            {/* Stages Timeline */}
            <div className="space-y-2 text-xs">
              {PIPELINE_STAGES.map((stg) => {
                const isDone = completedStages.includes(stg.key);
                const isCurrent = jobStatus === stg.key;

                return (
                  <div
                    key={stg.key}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 font-semibold border border-saffron-500/20'
                        : isDone
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 size={15} className="animate-spin text-saffron-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <span>{stg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature Capabilities Footer */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 font-medium">
              <Eye size={12} /> Visual Landmarks
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Type size={12} /> On-Screen OCR
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Compass size={12} /> Geo-Optimization
            </span>
          </div>
          <span className="text-slate-400">Gemini Native Multimodal</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
