'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTripSchema, CreateTripFormValues } from '@/lib/schemas/trip';
import { Button } from '@/components/ui/button';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  Share2
} from 'lucide-react';

import { useCreateTripMutation } from '@/hooks/useTripQueries';
import { validateTravelUrl } from '@/lib/validation/urlValidator';

const INDIA_DESTINATIONS = [
  'Jaipur, Rajasthan',
  'Udaipur, Rajasthan',
  'Varanasi, Uttar Pradesh',
  'South Goa, Goa',
  'Manali & Parvati Valley, Himachal',
  'Leh & Ladakh',
  'Munnar & Alleppey, Kerala',
  'Rishikesh, Uttarakhand',
  'Hampi, Karnataka',
  'Meghalaya & Shillong',
];

export default function NewTripPage() {
  const router = useRouter();
  const createTripMutation = useCreateTripMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: '',
      destinationRegion: '',
      durationDays: 3,
      budgetTotal: 15000,
      travelStyle: 'friends',
      initialSocialUrl: '',
    },
  });

  const selectedDestination = watch('destinationRegion');
  const selectedStyle = watch('travelStyle');
  const watchedUrl = watch('initialSocialUrl');

  const onSubmit = async (data: CreateTripFormValues) => {
    if (data.initialSocialUrl && data.initialSocialUrl.trim() !== '') {
      const val = validateTravelUrl(data.initialSocialUrl.trim());
      if (!val.isValid) {
        setUrlError(val.error || 'Only Instagram Reels, YouTube Shorts, and travel blogs are supported');
        return;
      }
    }
    setUrlError(null);
    setIsSubmitting(true);
    try {
      const newTrip = await createTripMutation.mutateAsync(data);
      router.push(`/trips/${newTrip.id}`);
    } catch (err: unknown) {
      console.error(err);
      setUrlError(err instanceof Error ? err.message : 'Location cannot be detected from this video transcript.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/20 bg-teal-600/10 px-3 py-1 text-xs text-teal-700 dark:text-teal-300">
            <Sparkles size={13} />
            <span>Trip Creation Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white font-heading">
            Create Your Next <span className="italic text-teal-600">Travel Itinerary</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Start fresh or paste an Instagram Reel, TikTok, or YouTube link with voice audio to extract places automatically.
          </p>
        </div>

        {/* Voice-to-Itinerary Guidance */}
        <div className="rounded-lg border border-teal-600/20 bg-teal-50/50 p-4 space-y-2 dark:border-teal-500/20 dark:bg-teal-950/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Sparkles size={14} className="text-teal-600 shrink-0" />
            <span>Voice-Powered Travel Extraction</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Provide any travel video with voice narration. Ghoomo analyzes the spoken transcript to verify real locations. If places are mentioned, AI creates your day-by-day plan, sets ideal duration, estimates budget, and prepares your packing checklist.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
            {/* Social URL Import Input */}
            <div className="space-y-1.5 p-4 rounded-md border border-teal-600/20 bg-teal-50/50 dark:border-teal-500/20 dark:bg-teal-950/20">
              <label className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
                <LinkIcon size={14} />
                <span>Add from Reel, Short, or blog (Instagram, TikTok, YouTube)</span>
                <span className="text-[10px] bg-teal-600/15 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-sm font-normal">Optional</span>
              </label>
              <input
                type="url"
                {...register('initialSocialUrl')}
                placeholder="https://www.instagram.com/reel/... or https://youtube.com/shorts/..."
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
              <p className="text-[11px] text-slate-500">
                Ghoomo will automatically scan this post and place detected locations onto your map.
              </p>
              {errors.initialSocialUrl && (
                <p className="text-xs text-red-600">{errors.initialSocialUrl.message}</p>
              )}
              {urlError && (
                <p className="text-xs text-red-600 font-medium">{urlError}</p>
              )}
            </div>

            {/* Trip Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Trip Name</label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Switzerland Alpine Trail or leave blank to auto-detect"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            {/* Destination & Duration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin size={13} className="text-teal-600" />
                  <span>Destination Region</span>
                </label>
                <input
                  type="text"
                  {...register('destinationRegion')}
                  placeholder="e.g. Switzerland, Manali, South Goa (or auto-detected from link)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />
                {errors.destinationRegion && (
                  <p className="text-xs text-red-600">{errors.destinationRegion.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar size={13} className="text-teal-600" />
                  <span>Duration (Days)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  {...register('durationDays', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />
                {errors.durationDays && (
                  <p className="text-xs text-red-600">{errors.durationDays.message}</p>
                )}
              </div>
            </div>

            {/* Budget Total */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign size={13} className="text-emerald-600" />
                <span>Estimated Total Budget (₹ INR)</span>
              </label>
              <input
                type="number"
                step={500}
                {...register('budgetTotal', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
              />
              {errors.budgetTotal && (
                <p className="text-xs text-red-600">{errors.budgetTotal.message}</p>
              )}
            </div>

            {/* Travel Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users size={13} className="text-teal-600" />
                <span>Travel Style</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'solo', label: 'Solo Backpacker' },
                  { id: 'couple', label: 'Couple Escape' },
                  { id: 'friends', label: 'Friends Group' },
                  { id: 'family', label: 'Family Vacation' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setValue('travelStyle', style.id as any)}
                    className={`px-3 py-2 rounded-md text-xs font-medium border text-center transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                      selectedStyle === style.id
                        ? 'border-teal-600 bg-teal-600/10 text-teal-800 dark:text-teal-200 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-md cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all duration-100"
              >
                {isSubmitting ? (
                  <span>Building Smart Trip Plan & Map...</span>
                ) : (
                  <>
                    <span>Create Smart Trip Plan</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
