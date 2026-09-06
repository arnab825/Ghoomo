import React from "react";
import Link from "next/link";
import { Compass, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-8 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-saffron-500 flex items-center justify-center text-black font-bold">
            <Compass size={14} />
          </div>
          <span className="font-bold text-white">Ghoomo</span>
          <span className="text-slate-600">•</span>
          <span>Social-to-Itinerary Travel Platform for India</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/trips" className="hover:text-white transition-colors">
            Workspaces
          </Link>
          <Link
            href="/trips/new"
            className="hover:text-white transition-colors"
          >
            Create Trip
          </Link>
          <Link href="/auth" className="hover:text-white transition-colors">
            Demo Auth
          </Link>
        </div>

        <div className="flex items-center gap-1 text-slate-500">
          <span>Built for India Travel Hackathon</span>
        </div>
      </div>
    </footer>
  );
}
