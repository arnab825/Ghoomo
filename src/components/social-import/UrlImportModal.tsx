'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { tripService } from '@/lib/services/tripService';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Link as LinkIcon, CheckCircle2, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import ProgressiveLoading from '@/components/shared/ProgressiveLoading';
import { extractLocationsFromUrlAction } from '@/app/actions/aiActions';
import { TripSource, Place, AITier } from '@/lib/types/ghoomo';
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
  const { currentUser, deductCredits } = useAuthStore();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTierUsed, setLastTierUsed] = useState<AITier | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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

      // Save to tripService
      const updatedTrip = await tripService.importSocialUrl(tripId, importUrl.trim());

      // Invalidate and update TanStack Query cache
      queryClient.setQueryData(TRIP_KEYS.detail(tripId), updatedTrip);
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.all });

      setIsLoading(false);
      setUrl('');
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }
  };

  return createPortal(
    <div
      style={{ zIndex: 99999 }}
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 space-y-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
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

        {/* Voice-to-Itinerary Guidance */}
        <div className="rounded-md border border-teal-600/20 bg-teal-50/50 p-3.5 space-y-2 dark:border-teal-500/20 dark:bg-teal-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Sparkles size={14} className="text-teal-600 shrink-0" />
            <span>Voice Speech & Location Detection</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Paste any travel video with spoken voice narration (Instagram Reels, YouTube Shorts, or TikTok). Ghoomo automatically analyzes the spoken audio transcript to detect real travel locations and builds your day plan, budget, and checklist.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
