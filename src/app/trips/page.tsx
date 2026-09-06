'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Plus,
  Sparkles,
  ArrowRight,
  Link as LinkIcon,
  Trash2,
  FolderHeart,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useTrips, useDeleteTripMutation, useDeleteAllTripsMutation } from '@/hooks/useTripQueries';
import { TripsListSkeleton } from '@/components/shared/skeletons/TripsListSkeleton';
import { useToast } from '@/components/shared/ToastContext';
import { getDestinationImage, sanitizeImageUrl } from '@/lib/utils/destinationImages';

export default function TripsDashboardPage() {
  const router = useRouter();
  const { data: trips = [], isLoading, isError, error, refetch } = useTrips();
  const deleteTripMutation = useDeleteTripMutation();
  const deleteAllTripsMutation = useDeleteAllTripsMutation();
  const { toast, confirmModal } = useToast();

  const handleDeleteAllTrips = () => {
    if (trips.length === 0) return;
    const count = trips.length;
    confirmModal({
      title: 'Delete All Saved Trips?',
      message: `Are you sure you want to delete all ${count} saved trip plans? All itineraries, places, and checklists will be permanently cleared.`,
      confirmText: 'Delete All Trips',
      variant: 'danger',
      onConfirm: async () => {
        await deleteAllTripsMutation.mutateAsync();
        toast.success(`All ${count} trip plans have been deleted.`);
      },
    });
  };

  const handleDeleteSingleTrip = (e: React.MouseEvent, tripTitle: string, tripId: string) => {
    e.stopPropagation();
    confirmModal({
      title: 'Delete Trip Plan',
      message: `Are you sure you want to delete "${tripTitle}"? This action cannot be undone.`,
      confirmText: 'Delete Trip',
      variant: 'danger',
      onConfirm: async () => {
        await deleteTripMutation.mutateAsync(tripId);
        toast.success(`"${tripTitle}" deleted successfully.`);
      },
    });
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return <TripsListSkeleton />;
  }

  // 2. Error State with Retry
  if (isError) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 text-center space-y-4">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-rose-950/50">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
          Failed to Load Trips
        </h2>
        <p className="text-xs text-slate-500">
          {error instanceof Error ? error.message : 'Unable to connect to trip services. Please check your network.'}
        </p>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => refetch()}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={13} className="mr-1.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/">
            <Button variant="outline" className="text-xs px-4 py-2 rounded-md shadow-xs active:scale-[0.98] cursor-pointer">
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fafbfc] dark:bg-[#070a10] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Static Ambient Glow matching landing page without moving animations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[320px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(249,115,22,0.06),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(249,115,22,0.10),rgba(0,0,0,0))] pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8 relative z-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50/80 px-3.5 py-1.5 text-xs font-semibold text-orange-800 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-300 shadow-2xs mb-2.5">
            <Sparkles size={13} className="text-orange-600 dark:text-orange-400" />
            <span>Trip Workspaces</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-slate-900 dark:text-white font-heading">
            Your <span className="italic font-bold bg-gradient-to-r from-orange-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">Smart Trip Plans</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Map-first itineraries generated from Instagram Reels, TikTok, YouTube Shorts, and travel blogs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {trips.length > 0 && (
            <Button
              onClick={handleDeleteAllTrips}
              variant="outline"
              disabled={deleteAllTripsMutation.isPending}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-semibold py-2.5 px-3.5 rounded-xl cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100 flex items-center gap-1.5"
              title="Delete all saved trip plans"
            >
              <Trash2 size={14} className={deleteAllTripsMutation.isPending ? 'animate-pulse text-red-400' : 'text-red-500'} />
              <span>{deleteAllTripsMutation.isPending ? 'Deleting All...' : 'Delete All Trips'}</span>
            </Button>
          )}

          <Link href="/trips/new" className="cursor-pointer">
            <Button className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-orange-500/25 active:scale-[0.98] transition-all duration-100 flex items-center gap-1.5">
              <Plus size={15} />
              <span>Plan New Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Trips Grid & Empty State */}
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200/90 bg-white/90 p-12 text-center space-y-4 max-w-md mx-auto shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 flex items-center justify-center mx-auto shadow-2xs">
            <Compass size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">No trips created yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Turn your favorite travel Reel, Short, or saved blog into an organized itinerary across India.
          </p>
          <Link href="/trips/new" className="cursor-pointer inline-block pt-1">
            <Button className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-[0.98] transition-all duration-100 cursor-pointer shadow-md shadow-orange-500/25 flex items-center gap-1.5">
              <Plus size={14} />
              <span>Create First Trip</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const cover = sanitizeImageUrl(trip.coverImage, trip.destinationRegion, trip.title);
            return (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden hover:border-orange-500/40 hover:-translate-y-1 hover:shadow-[0_14px_30px_-5px_rgba(249,115,22,0.12)] transition-all duration-200 cursor-pointer flex flex-col shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900/80 active:scale-[0.99]"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <img
                    src={cover}
                    alt={trip.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = getDestinationImage(trip.destinationRegion, trip.title);
                    }}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:text-slate-200 shadow-xs backdrop-blur-md">
                      {trip.travelStyle}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingleTrip(e, trip.title, trip.id)}
                      className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-slate-600 hover:text-rose-600 dark:bg-slate-900/85 dark:text-slate-400 dark:hover:text-rose-400 transition-all duration-100 cursor-pointer shadow-xs active:scale-[0.95]"
                      title="Delete trip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-medium drop-shadow-xs">
                      <MapPin size={13} className="text-orange-400" /> {trip.destinationRegion}
                    </span>
                    <span className="flex items-center gap-1 drop-shadow-xs text-slate-200">
                      <Calendar size={13} /> {trip.durationDays} Days
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug line-clamp-2">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{trip.places.length} places mapped</span>
                      <span>•</span>
                      <span className="text-orange-600 dark:text-orange-400 font-bold font-mono">
                        ₹{trip.budgetTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Sources & Collaborators row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <LinkIcon size={12} className="text-orange-500" />
                      <span>{trip.sources.length} source{trip.sources.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="flex -space-x-2">
                      {trip.collaborators.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-700 overflow-hidden shadow-2xs"
                        >
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            c.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
