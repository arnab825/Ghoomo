'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Sparkles,
  Link as LinkIcon,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Share2,
  DollarSign,
  CheckSquare,
  Play
} from 'lucide-react';
import { SAMPLE_VIRAL_REELS } from '@/features/social-import/sampleReels';
import { useGhoomoStore } from '@/stores/useGhoomoStore';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const { createTrip } = useGhoomoStore();
  const [pastedUrl, setPastedUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickExtract = async (urlToUse?: string) => {
    const url = urlToUse || pastedUrl;
    if (!url || url.trim() === '') {
      router.push('/trips/new');
      return;
    }

    setIsProcessing(true);
    try {
      // Find matching sample or default destination
      const matched = SAMPLE_VIRAL_REELS.find((s) => url.includes(s.id) || url === s.url);
      const destination = matched ? matched.destination : 'India Expedition';
      const title = matched ? matched.title.slice(0, 40) : 'Discovered Social Reel Itinerary';

      const newTripId = await createTrip({
        title,
        destinationRegion: destination,
        durationDays: 3,
        budgetTotal: 15000,
        travelStyle: 'friends',
        initialSocialUrl: url,
      });

      router.push(`/trips/${newTripId}`);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-20 overflow-hidden">
      {/* 1. HERO & SOCIAL URL EXTRACTOR */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6">
        {/* Ambient Subtle Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl space-y-7 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-600/10 px-4 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <Sparkles size={14} />
            <span>Turn Social Travel Inspiration into Real Indian Trips</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-7xl font-normal tracking-tight text-slate-900 dark:text-white font-heading leading-[1.08]">
            Stop Saving Reels. <br />
            <span className="italic bg-linear-to-r from-teal-600 via-teal-700 to-orange-500 bg-clip-text text-transparent">
              Start Traveling India.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Paste any Instagram Reel, TikTok, YouTube Short, or travel blog. Ghoomo extracts verified Indian places,
            pins them on Light Matter maps, and auto-generates smart day-wise routes.
          </p>

          {/* Core Feature: Interactive Social URL Input Box */}
          <div className="max-w-2xl mx-auto rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5 shadow-md dark:border-slate-800 dark:bg-slate-900/90 ring-1 ring-slate-950/5">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <LinkIcon size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="url"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="Paste Instagram Reel, TikTok, YouTube Short, or blog..."
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />
              </div>

              <Button
                onClick={() => handleQuickExtract()}
                disabled={isProcessing}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-md cursor-pointer shadow-xs flex items-center justify-center gap-2 transition-all duration-100 active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span>Extracting Places...</span>
                ) : (
                  <>
                    <span>Smart trip plan</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>

            {/* Quick Reel Chips */}
            <div className="pt-3 px-1 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Play size={11} className="text-orange-500" /> Try viral reels:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_VIRAL_REELS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleQuickExtract(sample.url)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-teal-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 transition-all duration-100 cursor-pointer active:scale-[0.98]"
                  >
                    {sample.destination.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW GHOOMO WORKS (4 STEPS) */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              The Core Problem & Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 dark:text-white font-heading">
              From Scattered Saved Links to a Master Trip Plan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'Add from Reel, Short, or blog',
                desc: 'Drop in any TikTok, Instagram Reel, YouTube short, or travel blog. No manual typing needed.',
                icon: LinkIcon,
                color: 'text-orange-500 bg-orange-50 dark:bg-slate-800',
              },
              {
                step: '02',
                title: 'Extract Locations',
                desc: 'Verified coordinates with Indian reference datasets and how sure we are match scores.',
                icon: MapPin,
                color: 'text-teal-600 bg-teal-50 dark:bg-slate-800',
              },
              {
                step: '03',
                title: 'Smart trip plan',
                desc: 'Best route for your trip grouped into days without zigzagging across India traffic.',
                icon: Compass,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-slate-800',
              },
              {
                step: '04',
                title: 'Plan with friends',
                desc: 'Invite friends via shareable link to vote on stops, split estimated budget, and check packing lists.',
                icon: Users,
                color: 'text-cyan-600 bg-cyan-50 dark:bg-slate-800',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="card-micro rounded-lg border border-slate-200 bg-white p-6 space-y-3 relative hover:border-teal-600/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/50 shadow-xs"
                >
                  <span className="text-xs font-mono font-bold text-slate-400 block">{card.step}</span>
                  <div className={`h-10 w-10 rounded-md flex items-center justify-center ${card.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED VIRAL EXPERIENCES READY TO CLONE */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                Trending Indian Experiences
              </span>
              <h2 className="text-3xl font-normal text-slate-900 dark:text-white font-heading">
                Explore Pre-Mapped Itineraries
              </h2>
            </div>
            <Link href="/trips" className="cursor-pointer">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded-md active:scale-[0.98] cursor-pointer">
                View All Workspaces <ArrowRight size={13} className="ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAMPLE_VIRAL_REELS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => handleQuickExtract(sample.url)}
                className="card-micro group rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-teal-600/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer shadow-xs flex flex-col dark:border-slate-800 dark:bg-slate-900/70 active:scale-[0.99]"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={sample.thumbnailUrl}
                    alt={sample.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/90 text-slate-900 backdrop-blur-xs shadow-xs">
                      {sample.platform}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[11px] text-teal-600 font-semibold block">
                      {sample.destination}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 dark:text-white transition-colors line-clamp-2">
                      {sample.title}
                    </h4>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>{sample.places.length} places</span>
                    <span className="text-emerald-600 font-semibold">Ready to map</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl rounded-lg border border-teal-900/20 bg-linear-to-br from-teal-900 via-teal-950 to-slate-950 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl text-white">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-normal text-white font-heading">
              Ready to Turn Social Links into a Trip?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Create your first trip in 30 seconds. Plan with friends, track expenses, and view everything on an interactive map.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/trips/new" className="cursor-pointer w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100">
                Create Free Trip
              </Button>
            </Link>
            <Link href="/auth" className="cursor-pointer w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm px-6 py-3 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100">
                Switch Demo Persona
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
