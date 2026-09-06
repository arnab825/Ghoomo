"use client";

import React, { useState, useEffect } from "react";
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
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GhoomoLogo from "@/components/shared/GhoomoLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch (_) {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch (_) {}
    }
  };

  const navLinks = [
    { href: "/trips", label: "My Trips", icon: FolderHeart },
    { href: "/pricing", label: "Pricing", icon: Sparkles },
  ];

  const credits = currentUser?.credits ?? 9;
  const isLowCredits = credits < 5;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85 transition-colors duration-200">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center cursor-pointer group active:scale-[0.98] transition-transform duration-100">
          <GhoomoLogo size="md" />
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 shadow-xs"
                    : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/60 dark:text-slate-300 dark:hover:text-orange-400 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon size={14} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Credits, Theme Toggle, Username Persona, and Actions */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Credit Counter Pill */}
          <Link
            href="/pricing"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all duration-100 cursor-pointer active:scale-[0.98] ${
              isLowCredits
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300'
                : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/60 dark:border-orange-800 dark:text-orange-300'
            }`}
          >
            <Sparkles size={13} className={isLowCredits ? 'text-amber-600' : 'text-orange-600'} />
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
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-100 cursor-pointer active:scale-[0.98]"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <UserCheck size={14} className="text-orange-500" />
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

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-500/50 dark:hover:text-orange-400 transition-all duration-150 cursor-pointer active:scale-95 shadow-xs"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
          </button>

          {/* Upgrade Button if credits < 5 */}
          {isLowCredits && (
            <Link href="/pricing">
              <Button
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs font-semibold py-1.5 px-2.5 rounded-lg cursor-pointer shadow-xs active:scale-[0.98] dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40"
              >
                Top up
              </Button>
            </Link>
          )}

          <Link href="/trips/new">
            <Button
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all duration-100"
            >
              <Plus size={14} className="mr-1" />
              <span>New Trip</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle & Theme Toggle */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer active:scale-[0.98] transition-all duration-100 rounded-md"
            aria-label="Toggle Navigation"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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
