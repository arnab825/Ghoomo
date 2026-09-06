'use client';

import React, { useState } from 'react';
import { useGhoomoStore } from '@/stores/useGhoomoStore';
import { SAMPLE_VIRAL_REELS } from '@/features/social-import/sampleReels';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Link as LinkIcon, CheckCircle2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import ProgressiveLoading from '@/components/shared/ProgressiveLoading';
import { extractLocationsFromUrlAction, AITier } from '@/app/actions/aiActions';
import { TripSource, Place } from '@/lib/types/ghoomo';
import { validateTravelUrl } from '@/lib/validation/urlValidator';
import { useQueryClient } from '@tanstack/react-query';
import { TRIP_KEYS } from '@/hooks/useTripQueries';
import { useAuthStore } from '@/stores/useAuthStore';

interface UrlImportModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UrlImportModal({ tripId, isOpen, onClose }: UrlImportModalProps) {
  const queryClient = useQueryClient();
  const { trips, setTripItinerary } = useGhoomoStore();
  const { currentUser, deductCredits } = useAuthStore();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTierUsed, setLastTierUsed] = useState<AITier | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImport = async (targetUrl?: string) => {
    const importUrl = targetUrl || url;
    if (!importUrl || importUrl.trim() === '') {
      setError('Please enter a link to an Instagram Reel, YouTube Short, or travel blog');
      return;
    }

    // Check credits before proceeding
    if ((currentUser.credits ?? 9) < 1) {
      setError('You have 0 credits remaining. Please top up your credits on the Pricing page to extract more travel spots.');
      return;
    }

    // 1. Client-side URL Validation Guardrail
    const validation = validateTravelUrl(importUrl.trim());
    if (!validation.isValid) {
      setError(validation.error || 'Only Instagram Reels, YouTube Shorts, and travel blogs are supported');
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationWarnings([]);

    try {
      // Call the 3-Tier AI Fallback Server Action with userId
      const response = await extractLocationsFromUrlAction({
        url: importUrl.trim(),
        tripId,
        userId: currentUser.id,
      });

      if (!response.success) {
        throw new Error(response.error || 'Unable to extract locations');
      }

      // Deduct 1 credit locally in auth store
      deductCredits(1);

      setLastTierUsed(response.tierUsed);
      if (response.validation?.warnings?.length > 0) {
        setValidationWarnings(response.validation.warnings);
      }

      // Add source & places into data store and invalidate queries
      const currentTrip = trips.find((t) => t.id === tripId);
      if (currentTrip) {
        const sourceId = `src-${Date.now()}`;
        const newSource: TripSource = {
          ...response.data.source,
          id: sourceId,
          tripId,
          createdAt: new Date().toISOString(),
        };

        const newPlaces: Place[] = response.data.places.map((p, idx) => ({
          ...p,
          id: `place-${Date.now()}-${idx}`,
          tripId,
          sourceId,
          createdAt: new Date().toISOString(),
        }));

        const combinedPlaces = [...currentTrip.places, ...newPlaces];
        const { autoGenerateItinerary } = useGhoomoStore.getState();

        useGhoomoStore.setState((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  sources: [...t.sources, newSource],
                  places: combinedPlaces,
                  coverImage: t.sources.length === 0 ? newSource.thumbnailUrl : t.coverImage,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));

        // Trigger route clustering
        autoGenerateItinerary(tripId);

        // Invalidate TanStack Query cache
        queryClient.invalidateQueries({ queryKey: TRIP_KEYS.detail(tripId) });
        queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });
      }

      setIsLoading(false);
      setUrl('');
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 space-y-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600/10 text-teal-700 border border-teal-600/20">
              <LinkIcon size={18} />
            </div>
            <div>
              <h2 className="text-xl font-normal text-slate-900 dark:text-white font-heading">
                Add from <span className="italic text-teal-600">Reel, Short, or blog</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste Instagram Reels, TikTok, YouTube Shorts, or travel blogs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all duration-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* URL Input Box */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Social Post or Reel URL</label>
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-sm border border-teal-200 dark:border-teal-800">
                This will use 1 credit
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://www.instagram.com/reel/C... or https://youtube.com/shorts/..."
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              />
              <Button
                onClick={() => handleImport()}
                disabled={isLoading || !url}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-4 py-2.5 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100 shadow-xs"
              >
                <span>Extract Places</span>
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {/* Progressive Loading Feedback */}
          <ProgressiveLoading isLoading={isLoading} />

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 size={12} /> 3-Tier AI (Gemini 1.5 Flash → Groq Llama 3.1 70B → Proximity Clustering)
            </span>
            <span>•</span>
            <span>Zero-Crash Fallback</span>
          </div>
        </div>

        {/* Instant Demo Presets */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-600" />
              <span>Or click a viral demo reel:</span>
            </span>
            <span className="text-[10px] text-teal-700 font-semibold">Instant 1-Click Extraction</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_VIRAL_REELS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleImport(sample.url)}
                disabled={isLoading}
                className="card-micro flex items-center gap-3 p-2.5 rounded-md border border-slate-200 bg-slate-50 hover:border-teal-600/60 hover:bg-teal-50/40 text-left transition-all duration-200 cursor-pointer active:scale-[0.98] group dark:border-slate-800 dark:bg-slate-900/60"
              >
                <img
                  src={sample.thumbnailUrl}
                  alt={sample.title}
                  className="h-10 w-10 rounded-md object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 dark:text-white truncate">
                    {sample.destination}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{sample.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
