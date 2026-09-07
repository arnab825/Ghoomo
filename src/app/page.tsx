'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  Sparkles,
  GitFork,
  Target,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Layers,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-linear-to-tr from-indigo-500/15 via-blue-500/10 to-emerald-500/15 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-96 -left-48 w-[600px] h-[450px] bg-linear-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-[100px] rounded-full" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center space-y-7">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 dark:border-indigo-900/60 dark:bg-slate-900/80 px-4 py-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300 shadow-xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
          </span>
          <Compass size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>AI-Powered Personal Learning Guide</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 dark:text-white font-heading leading-[1.08]">
            Navigate your way to{' '}
            <span className="bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-800 bg-clip-text text-transparent">
              mastery.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            Not a boring playlist. Not a generic course. EduSpark is Google Maps for Learning — turn-by-turn guidance that automatically finds the fastest path for you.
          </p>
        </div>

        {/* 30-Second Core Value Contrast */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
          <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Traditional Online Courses
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Forces every student through the exact same 40 videos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Punishes mistakes instead of explaining the core concept.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Leaves missing fundamentals completely overlooked.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
              EduSpark Smart Learning Guide
            </div>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Skips topics you already know to save you hours of time.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Offers friendly quick-reviews the moment you get stuck.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>Always highlights your single <strong>Recommended Next Step</strong>.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {isAuthenticated ? (
            <Link href="/app">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center gap-2 group transition-all duration-200 hover:scale-[1.02]">
                <Compass size={16} />
                <span>Go to Your Dashboard</span>
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => openAuthModal('sign-up')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center gap-2 group transition-all duration-200 hover:scale-[1.02]"
            >
              <Compass size={16} />
              <span>Get Started Free</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
          <Link href="/pricing">
            <Button variant="outline" className="text-xs font-semibold py-3 px-6 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
              <span>View Pricing Plans</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {/* Interactive Loop Diagram Banner */}
        <div className="max-w-4xl mx-auto mt-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                ★
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                How EduSpark Helps You Learn
              </span>
            </div>
            <span className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
              Personalized & Guided
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
            {[
              { step: '1. Goal', desc: 'Choose what to learn' },
              { step: '2. Fast Quiz', desc: 'Check what you know' },
              { step: '3. Roadmap', desc: 'Smart step-by-step path' },
              { step: '4. Next Step', desc: 'Tailored study activity' },
              { step: '5. Practice', desc: 'Interactive questions' },
              { step: '6. Support', desc: 'Quick review if stuck' },
              { step: '7. Mastery', desc: 'Celebrate your progress' },
            ].map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left">
                <span className="text-2xs font-bold text-indigo-600 dark:text-indigo-400 block">
                  {s.step}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block truncate">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 py-12 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
              <GitFork size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Smart Adaptive Path
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Never get stuck on topics you already know or struggle without the basics. EduSpark adjusts your roadmap dynamically as you learn.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Brain size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Real Skill Mastery
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Gain lasting confidence with hand-picked videos, easy-to-follow study notes, and smart practice questions built for deep understanding.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold">
              <Target size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Always Know What's Next
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No confusion or analysis paralysis. You'll always know exactly which lesson to do next, why it matters, and how much time you've saved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
