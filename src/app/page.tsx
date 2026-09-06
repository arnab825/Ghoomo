"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MapPin,
  Compass,
  Sparkles,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Brain,
  Layers,
  Search,
  Globe2,
  Users,
  Award,
  Play,
  FileText,
  HelpCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/useUIStore";

export default function HomePage() {
  const router = useRouter();
  const { setActiveProductMode } = useUIStore();
  const [topicInput, setTopicInput] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Class 8");
  const [selectedSubject, setSelectedSubject] = useState("History");

  const handleCreateJourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) {
      router.push("/learn/new");
      return;
    }
    const query = new URLSearchParams({
      topic: topicInput.trim(),
      grade: selectedGrade,
      subject: selectedSubject,
    });
    router.push(`/learn/new?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.06),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(37,99,235,0.12),rgba(0,0,0,0))] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center space-y-8">
        {/* SIH Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-2xs">
          <GraduationCap size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span>Smart India Hackathon 2026 • AICTE PS 26207: Smart Education</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-slate-950 dark:text-white font-heading leading-[1.1]">
            Learn where the <br className="hidden sm:inline" />
            <span className="italic font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
              knowledge lives.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
            Turn videos, articles, curriculum topics, and real-world places into personalized learning journeys with AI.
          </p>
        </div>

        {/* Cognitive Pipeline Breadcrumb */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 py-2 px-4 rounded-full bg-white/80 border border-slate-200/80 text-[11px] sm:text-xs font-medium text-slate-600 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-400 shadow-2xs backdrop-blur-sm">
          <span>Content</span>
          <span className="text-slate-400">→</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">AI Understanding</span>
          <span className="text-slate-400">→</span>
          <span>Learning Objectives</span>
          <span className="text-slate-400">→</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Real-World Place</span>
          <span className="text-slate-400">→</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">Active Mastery</span>
        </div>

        {/* Interactive Topic Input Box */}
        <div className="max-w-2xl mx-auto pt-2">
          <form
            onSubmit={handleCreateJourney}
            className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/40 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-2 text-left"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5">
              <Search size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Indian Freedom Movement, Photosynthesis, or paste a video URL..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option>Class 6</option>
                <option>Class 8</option>
                <option>Class 10</option>
                <option>Class 12</option>
                <option>Undergraduate</option>
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option>History</option>
                <option>Science</option>
                <option>Geography</option>
                <option>Civics</option>
                <option>Literature</option>
              </select>

              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>Generate</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </form>
        </div>

        {/* Quick CTAs */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/learn/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 cursor-pointer">
              Create Learning Journey
            </Button>
          </Link>
          <Link href="/trips">
            <Button
              variant="outline"
              onClick={() => setActiveProductMode("travel")}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
            >
              <Compass size={14} className="mr-1.5 text-orange-500" />
              <span>Consumer Travel Mode</span>
            </Button>
          </Link>
        </div>

        {/* 10-Second Executive Brief for Hackathon Judges & Educators */}
        <div className="max-w-4xl mx-auto mt-8 p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-950/80 shadow-lg shadow-indigo-950/5 text-left space-y-3.5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                ★
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                SIH 2026 Executive Architecture (The 10-Second Test)
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              <GraduationCap size={13} />
              <span>AICTE Problem Statement 26207</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                WHAT
              </span>
              <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                AI-powered smart learning journeys.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                WHO
              </span>
              <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                Students, teachers & educational groups.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                HOW
              </span>
              <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                Converts digital topics into personalized inquiry journeys.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                WHY
              </span>
              <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                Effective, efficient, flexible & comfortable.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800/60 space-y-1 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                THE PARADIGM
              </span>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 leading-snug text-[11px]">
                "Places are not merely destinations. They are learning contexts."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Architecture Cards (Learn, Explore, Travel) */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="text-center space-y-2 mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Unified Learning Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 dark:text-white font-heading">
            Three Modes. One Intelligent Platform.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            From classroom digital lessons to location-based discovery and family journeys, knowledge adapts to your context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: LEARN */}
          <div
            onClick={() => router.push("/learn")}
            className="rounded-2xl border border-indigo-200/80 bg-white dark:border-indigo-950 dark:bg-slate-900/80 p-6 space-y-4 hover:border-indigo-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen size={20} />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Digital Mode
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Learn
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pure digital inquiry journeys. Enter topics like the Indian Constitution or Photosynthesis and get structured objectives, briefings, and quizzes.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>View Digital Journeys</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: EXPLORE (Featured) */}
          <div
            onClick={() => router.push("/learn/kolkata-heritage-demo")}
            className="relative rounded-2xl border-2 border-emerald-500/80 bg-white dark:border-emerald-500/60 dark:bg-slate-900/90 p-6 space-y-4 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              SIH Flagship Demo
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 flex items-center justify-center font-bold">
                <MapPin size={20} />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Location-Aware
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  Explore
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Experiential learning in physical places. Connect curriculum concepts directly to historical monuments, nature reserves, and museums.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Try Kolkata Heritage Demo</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: TRAVEL */}
          <div
            onClick={() => {
              setActiveProductMode("travel");
              router.push("/trips");
            }}
            className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-6 space-y-4 hover:border-orange-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/70 dark:text-orange-400 flex items-center justify-center font-bold">
                <Compass size={20} />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  Consumer Travel
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                  Travel
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ghoomo’s original travel planning studio. Transform social reels into multi-day itineraries with group chat, budgets, and checklists.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
              <span>Open Travel Studio</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Demo Showcase: Kolkata Heritage */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles size={14} />
                <span>Featured SIH 26207 Live Demonstration</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white font-heading">
                Kolkata Heritage: Freedom Movement & Colonial Architecture
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Class 8 • History • 2 Days • 4 Verified Field Stops (Victoria Memorial, Indian Museum, College Street, Netaji Bhawan).
              </p>
            </div>

            <Link href="/learn/kolkata-heritage-demo">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-5 rounded-xl cursor-pointer shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-2">
                <span>Launch Interactive Demo</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          {/* 5-Stage Learning Pipeline Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Stage 1</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">1. Prepare</div>
              <p className="text-[11px] text-slate-500 leading-snug">Contextual briefings & prior knowledge checks.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
              <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Stage 2</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">2. Explore</div>
              <p className="text-[11px] text-slate-500 leading-snug">GPS-anchored observation missions at the site.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Stage 3</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">3. Practice</div>
              <p className="text-[11px] text-slate-500 leading-snug">Hands-on evidence gathering & artifact inquiry.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Stage 4</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">4. Assess</div>
              <p className="text-[11px] text-slate-500 leading-snug">In-situ interactive comprehension quizzes.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Stage 5</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">5. Reflect</div>
              <p className="text-[11px] text-slate-500 leading-snug">Personal reflections evaluated with AI feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SIH 26207 4-Pillar Educational Alignment */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 py-12 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center space-y-2 mb-10">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Aligned with AICTE Smart Education (PS 26207)
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 dark:text-white font-heading">
            How Ghoomo Enables Smarter Learning in the Digital Age
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1: Effective */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold">
              <Brain size={18} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">1. More Effective</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Replaces passive reading with experiential observation, active missions, and on-site inquiry questions that anchor memory.
            </p>
          </div>

          {/* Pillar 2: Efficient */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">2. More Efficient</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AI automatically structures noisy digital sources into curriculum-aligned learning objectives, schedules, and quizzes in seconds.
            </p>
          </div>

          {/* Pillar 3: Flexible */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">3. More Flexible</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Supports any grade level (Class 6 to College), subject, difficulty, and delivery mode (Digital, Local Field, or Regional Tour).
            </p>
          </div>

          {/* Pillar 4: Comfortable */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">4. More Comfortable</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mobile-first student interface with an adaptive Learning Copilot that answers questions at the exact grade level without intimidation.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Final Call to Action */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-normal text-slate-950 dark:text-white font-heading">
          Ready to experience the next evolution in smart education?
        </h2>
        <div className="flex items-center justify-center gap-3">
          <Link href="/learn/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all">
              Create Your First Journey
            </Button>
          </Link>
          <Link href="/learn/kolkata-heritage-demo">
            <Button
              variant="outline"
              className="text-xs font-semibold py-3 px-6 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Explore Flagship Demo
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
