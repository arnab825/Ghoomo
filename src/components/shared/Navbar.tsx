"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Plus,
  FolderHeart,
  Users,
  Menu,
  X,
  UserCheck,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentUser, isAuthenticated } = useAuthStore();

  const navLinks = [
    { href: "/", label: "Home", icon: Compass },
    { href: "/trips", label: "My Trips", icon: FolderHeart },
    { href: "/pricing", label: "Pricing", icon: Sparkles },
    { href: "/trips/new", label: "Create Trip", icon: Plus },
  ];

  const credits = currentUser?.credits ?? 9;
  const isLowCredits = credits < 5;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-transform duration-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-xs">
            <Compass size={20} className="stroke-[2.2] group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-normal tracking-tight text-slate-900 dark:text-white">
              Ghoo<span className="text-teal-600 italic">mo</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Social Travel Studio
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-100 cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon size={14} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Credits, Username Persona, and Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Credit Counter Pill */}
          <Link
            href="/pricing"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold border transition-all duration-100 cursor-pointer active:scale-[0.98] ${
              isLowCredits
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-300'
            }`}
          >
            <Sparkles size={13} className={isLowCredits ? 'text-amber-600' : 'text-teal-600'} />
            <span className="font-mono">{credits} credits</span>
            {isLowCredits && (
              <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-1 rounded-xs dark:bg-amber-900 dark:text-amber-200">
                Low
              </span>
            )}
          </Link>

          {/* User Persona & Username */}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-100 cursor-pointer active:scale-[0.98]"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <UserCheck size={14} className="text-teal-600" />
            )}
            <div className="flex flex-col text-left">
              <span className="font-medium text-slate-800 dark:text-slate-200 leading-tight">
                {currentUser?.name || "Traveler"}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                @{currentUser?.username || "traveler_8472"}
              </span>
            </div>
          </Link>

          {/* Upgrade Button if credits < 5 */}
          {isLowCredits && (
            <Link href="/pricing">
              <Button
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs font-semibold py-1.5 px-2.5 rounded-md cursor-pointer shadow-xs active:scale-[0.98] dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40"
              >
                Top up
              </Button>
            </Link>
          )}

          <Link href="/trips/new">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs py-1.5 px-3.5 rounded-md cursor-pointer shadow-xs active:scale-[0.98] transition-all duration-100"
            >
              <Plus size={14} className="mr-1" />
              <span>New Trip</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer active:scale-[0.98] transition-all duration-100 rounded-md"
          aria-label="Toggle Navigation"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Active Evaluator:</span>
            <span className="text-teal-700 font-bold dark:text-teal-400">
              {currentUser?.name}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold cursor-pointer active:scale-[0.98] transition-all duration-100 ${
                    isActive
                      ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon size={14} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="pt-2">
            <Link
              href="/auth"
              onClick={() => setIsMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-100 hover:bg-slate-200 py-2 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-white cursor-pointer active:scale-[0.98] transition-all duration-100"
            >
              <UserCheck size={14} className="text-teal-600" />
              <span>Switch Demo Persona / Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
