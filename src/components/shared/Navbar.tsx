"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Plus,
  BookOpen,
  MapPin,
  Sparkles,
  Sun,
  Moon,
  UserCheck,
  Menu,
  X,
  GraduationCap,
  Layers,
  FolderHeart,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore, ProductMode } from "@/stores/useUIStore";
import { Button } from "@/components/ui/button";
import GhoomoLogo from "@/components/shared/GhoomoLogo";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { currentUser } = useAuthStore();
  const { activeProductMode, setActiveProductMode } = useUIStore();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  // Sync mode based on current URL path
  useEffect(() => {
    if (pathname.startsWith("/trips")) {
      setActiveProductMode("travel");
    } else if (pathname.startsWith("/learn") || pathname === "/") {
      if (activeProductMode === "travel") {
        setActiveProductMode("learn");
      }
    }
  }, [pathname, activeProductMode, setActiveProductMode]);

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

  const handleModeSwitch = (mode: ProductMode) => {
    setActiveProductMode(mode);
    if (mode === "travel") {
      router.push("/trips");
    } else if (mode === "explore") {
      router.push("/learn/kolkata-heritage-demo");
    } else {
      router.push("/learn");
    }
  };

  const isTravel = activeProductMode === "travel";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors duration-200">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand + SIH Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center cursor-pointer group active:scale-[0.98] transition-transform duration-100"
          >
            <GhoomoLogo size="md" />
          </Link>
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60">
            <GraduationCap size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span>SIH 2026 • AICTE Smart Education</span>
          </span>
        </div>

        {/* Center: Global Product Mode Switcher (LEARN | EXPLORE | TRAVEL) */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => handleModeSwitch("learn")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeProductMode === "learn"
                ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen size={13} className={activeProductMode === "learn" ? "text-indigo-600" : ""} />
            <span>Learn</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("explore")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeProductMode === "explore"
                ? "bg-white text-emerald-700 dark:bg-slate-800 dark:text-emerald-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <MapPin size={13} className={activeProductMode === "explore" ? "text-emerald-600" : ""} />
            <span>Explore</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("travel")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeProductMode === "travel"
                ? "bg-white text-orange-700 dark:bg-slate-800 dark:text-orange-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Compass size={13} className={activeProductMode === "travel" ? "text-orange-600" : ""} />
            <span>Travel</span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/learn"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              pathname === "/learn"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <BookOpen size={13} />
            <span>Journeys</span>
          </Link>
          <Link
            href="/learn/kolkata-heritage-demo"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              pathname.includes("kolkata-heritage-demo")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Flagship Demo</span>
          </Link>
          <Link
            href="/trips"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              pathname.startsWith("/trips")
                ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <FolderHeart size={13} />
            <span>Consumer Trips</span>
          </Link>
        </nav>

        {/* Right Section: Persona, Theme Toggle, Primary Action */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* User Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-100 cursor-pointer active:scale-[0.98]"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <UserCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
            )}
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser?.name || "Student Learner"}
              </span>
            </div>
          </Link>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-150 cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
          </button>

          {/* Primary Action Button */}
          {isTravel ? (
            <Link href="/trips/new">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all"
              >
                <Plus size={14} className="mr-1" />
                <span>Plan Trip</span>
              </Button>
            </Link>
          ) : (
            <Link href="/learn/new">
              <Button
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
              >
                <Plus size={14} className="mr-1" />
                <span>New Learning Journey</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
          </button>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded-lg cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950 animate-in slide-in-from-top-2">
          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold">
            <button
              onClick={() => {
                handleModeSwitch("learn");
                setIsMobileOpen(false);
              }}
              className={`py-1.5 rounded-lg text-center ${
                activeProductMode === "learn" ? "bg-white text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              Learn
            </button>
            <button
              onClick={() => {
                handleModeSwitch("explore");
                setIsMobileOpen(false);
              }}
              className={`py-1.5 rounded-lg text-center ${
                activeProductMode === "explore" ? "bg-white text-emerald-700 dark:bg-slate-800 dark:text-emerald-300 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => {
                handleModeSwitch("travel");
                setIsMobileOpen(false);
              }}
              className={`py-1.5 rounded-lg text-center ${
                activeProductMode === "travel" ? "bg-white text-orange-700 dark:bg-slate-800 dark:text-orange-300 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              Travel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-2">
            <Link
              href="/learn"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <BookOpen size={14} />
              <span>Learning Journeys</span>
            </Link>
            <Link
              href="/learn/kolkata-heritage-demo"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40"
            >
              <Sparkles size={14} />
              <span>Kolkata Heritage Demo</span>
            </Link>
            <Link
              href="/trips"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <FolderHeart size={14} />
              <span>Consumer Trips</span>
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/learn/new"
              onClick={() => setIsMobileOpen(false)}
              className="block"
            >
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl">
                <Plus size={14} className="mr-1" />
                <span>Create Learning Journey</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
