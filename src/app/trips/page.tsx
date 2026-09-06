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
import { useTrips, useDeleteTripMutation } from '@/hooks/useTripQueries';
import { TripsListSkeleton } from '@/components/shared/skeletons/TripsListSkeleton';

export default function TripsDashboardPage() {
  const router = useRouter();
  const { data: trips = [], isLoading, isError, error, refetch } = useTrips();
  const deleteTripMutation = useDeleteTripMutation();

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
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-teal-600/20 bg-teal-600/10 px-3 py-1 text-xs text-teal-700 dark:text-teal-300 mb-2">
            <FolderHeart size={13} />
            <span>Trip Workspaces</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white font-heading">
            Your <span className="italic text-teal-600">Smart Trip Plans</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Map-first itineraries generated from Instagram Reels, TikTok, YouTube Shorts, and travel blogs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/trips/new" className="cursor-pointer">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs py-2 px-4 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100">
              <Plus size={15} className="mr-1" />
              <span>Plan New Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Trips Grid & Empty State */}
      {trips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 max-w-md mx-auto shadow-xs dark:border-slate-800 dark:bg-slate-900/40">
          <div className="h-12 w-12 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 flex items-center justify-center mx-auto">
            <Compass size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">No trips created yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Turn your favorite travel Reel, Short, or saved blog into an organized itinerary across India.
          </p>
          <Link href="/trips/new" className="cursor-pointer inline-block pt-1">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-md active:scale-[0.98] transition-all duration-100 cursor-pointer shadow-xs">
              <Plus size={14} className="mr-1" />
              <span>Create First Trip</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const cover = trip.coverImage || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80';
            return (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="card-micro group rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-teal-600/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col shadow-xs dark:border-slate-800 dark:bg-slate-900/60 active:scale-[0.99]"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <img
                    src={cover}
                    alt={trip.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-md bg-white/90 text-slate-900 backdrop-blur-xs shadow-xs">
                      {trip.travelStyle}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${trip.title}"?`)) {
                          deleteTripMutation.mutate(trip.id);
                        }
                      }}
                      className="p-1.5 rounded-md bg-white/80 hover:bg-white text-slate-600 hover:text-red-600 transition-all duration-100 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="flex items-center gap-1 font-medium drop-shadow-xs">
                      <MapPin size={13} className="text-orange-400" /> {trip.destinationRegion}
                    </span>
                    <span className="flex items-center gap-1 drop-shadow-xs">
                      <Calendar size={13} /> {trip.durationDays} Days
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 dark:text-white transition-colors leading-snug">
                      {trip.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{trip.places.length} places mapped</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold font-mono">
                        ₹{trip.budgetTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Sources & Collaborators row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <LinkIcon size={12} className="text-teal-600" />
                      <span>{trip.sources.length} source{trip.sources.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="flex -space-x-2">
                      {trip.collaborators.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-700 overflow-hidden"
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
  );
}
