import React from "react";
import Link from "next/link";
import GhoomoLogo from "@/components/shared/GhoomoLogo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs py-8 mt-auto relative z-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <GhoomoLogo size="sm" showSubtitle={false} />
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-slate-600 dark:text-slate-400">Social-to-Itinerary Travel Platform for India</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link href="/" className="hover:text-orange-600 dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/trips" className="hover:text-orange-600 dark:hover:text-white transition-colors">
            Workspaces
          </Link>
          <Link
            href="/trips/new"
            className="hover:text-orange-600 dark:hover:text-white transition-colors"
          >
            Create Trip
          </Link>
          <Link href="/auth" className="hover:text-orange-600 dark:hover:text-white transition-colors">
            Demo Auth
          </Link>
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <span>Built for India Travel Hackathon</span>
        </div>
      </div>
    </footer>
  );
}
