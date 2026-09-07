'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Heart,
  Target,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

export default function AboutPage() {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Compass size={14} />
            <span>Our Mission & Vision</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 dark:text-white font-heading leading-tight">
            We believe learning should feel like navigation, not an obstacle course.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Every learner starts from a unique background, learns at a different pace, and stumbles on different concepts. Ghoomo gives every student their own personalized GPS for learning.
          </p>
        </div>

        {/* The Problem & Our Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center font-bold">
              ✕
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              The Old Way: Rigid Playlists
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional courses lock everyone into the exact same 40-video playlist. If you already know the first 10 lessons, you waste hours. If you stumble on lesson 15, there is no detour — only frustration and dropped courses.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold font-heading text-indigo-950 dark:text-indigo-200">
              The Ghoomo Way: Smart Guidance
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Ghoomo acts like turn-by-turn navigation. A quick diagnostic verifies what you already know so you skip ahead. If you miss a question, Ghoomo provides a quick review detour before continuing on your roadmap.
            </p>
          </div>
        </div>

        {/* 3 Core Values */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white">
              What Powers Our Philosophy
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Three commitments that guide everything we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                <Target size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Zero Guesswork
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You will always have a single, clear recommended next step. No endless browsing through course catalogs or wondering what to study today.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                <Brain size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Evidence-Based Mastery
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                We believe in genuine understanding over superficial completion badges. Skills are earned through verified practice questions and hands-on activities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Learner-First Simplicity
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Technology should stay out of your way. Clean interfaces, distraction-free study notes, and intuitive progress tracking that anyone can use.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white text-center space-y-6 shadow-xl">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-bold font-heading">
              Ready to learn faster and smarter?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Create your first personalized learning roadmap today. It takes less than 60 seconds to get started.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link href="/app">
                <Button className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm">
                  <span>Go to Your Dashboard</span>
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => openAuthModal('sign-up')}
                className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            )}
            <Link href="/pricing">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 text-xs px-5 py-2.5 rounded-xl">
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
