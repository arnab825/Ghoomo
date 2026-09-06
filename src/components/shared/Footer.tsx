import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import GhoomoLogo from "@/components/shared/GhoomoLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-8 mt-auto relative z-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Tagline */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <GhoomoLogo size="sm" showSubtitle={false} />
          </Link>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Experiential Learning Journeys & Smart Travel
          </span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 font-medium text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/learn" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Journeys
          </Link>
          <Link href="/learn/new" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Create Journey
          </Link>
          <Link
            href="/learn/kolkata-heritage-demo"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>Explore Journey</span>
          </Link>
          <Link href="/trips" className="hover:text-orange-600 dark:hover:text-white transition-colors">
            Plan Trips
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-slate-400 dark:text-slate-500 text-[11px]">
          © {new Date().getFullYear()} Ghoomo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

