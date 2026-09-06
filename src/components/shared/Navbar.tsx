'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Plus,
  BookOpen,
  Users,
  TrendingUp,
  Sparkles,
  Sun,
  Moon,
  UserCheck,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore, ProductMode } from '@/stores/useUIStore';
import { Button } from '@/components/ui/button';
import GhoomoLogo from '@/components/shared/GhoomoLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const { user, isAuthenticated, isLoading, logout, initializeAuth } = useAuthStore();
  const { activeProductMode, setActiveProductMode } = useUIStore();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  // Sync mode based on current URL path
  useEffect(() => {
    if (pathname.startsWith('/trips')) {
      setActiveProductMode('travel');
    } else if (pathname.startsWith('/learn') || pathname.startsWith('/teacher') || pathname.startsWith('/student') || pathname === '/') {
      if (activeProductMode === 'travel') {
        setActiveProductMode('learn');
      }
    }
  }, [pathname, activeProductMode, setActiveProductMode]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('theme', 'dark');
      } catch (_) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('theme', 'light');
      } catch (_) {}
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors duration-200">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center cursor-pointer group active:scale-[0.98] transition-transform duration-100"
          >
            <GhoomoLogo size="md" />
          </Link>
        </div>

        {/* Center: Role-Based Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          {isAuthenticated && isTeacher && (
            <>
              <Link
                href="/teacher/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/teacher/dashboard'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard size={13} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/teacher/journeys"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/teacher/journeys')
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <BookOpen size={13} />
                <span>My Journeys</span>
              </Link>
              <Link
                href="/teacher/assignments"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/teacher/assignments'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Users size={13} />
                <span>Assignments</span>
              </Link>
              <Link
                href="/teacher/progress"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/teacher/progress'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp size={13} />
                <span>Student Progress</span>
              </Link>
            </>
          )}

          {isAuthenticated && isStudent && (
            <>
              <Link
                href="/student/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/student/dashboard'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard size={13} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/student/journeys"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname.startsWith('/student/journeys')
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <BookOpen size={13} />
                <span>My Journeys</span>
              </Link>
              <Link
                href="/student/reflections"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/student/reflections'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Sparkles size={13} />
                <span>Reflections</span>
              </Link>
              <Link
                href="/student/progress"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/student/progress'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp size={13} />
                <span>Scorecard</span>
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <>
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  pathname === '/'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60'
                }`}
              >
                Home
              </Link>
              <Link
                href="/learn/kolkata-heritage-demo"
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-100/60 transition-all flex items-center gap-1"
              >
                <Sparkles size={13} className="text-emerald-600" />
                <span>Interactive Demo</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Section: User Profile, Theme Toggle, Primary Action */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-150 cursor-pointer active:scale-95"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
              </button>

              {/* Primary Action for Teacher */}
              {isTeacher && (
                <Link href="/teacher/journeys/create">
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Plus size={14} className="mr-1" />
                    <span>Create Journey</span>
                  </Button>
                </Link>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-150 cursor-pointer active:scale-95"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
              </button>

              <Link href="/login">
                <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl">
                  <LogIn size={13} className="mr-1" />
                  <span>Sign In</span>
                </Button>
              </Link>

              <Link href="/signup">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20"
                >
                  <span>Get Started</span>
                </Button>
              </Link>
            </>
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
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                    Role: {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileOpen(false);
                  }}
                  className="text-xs text-red-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>

              {isTeacher && (
                <div className="grid grid-cols-1 gap-1 text-xs font-semibold">
                  <Link
                    href="/teacher/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Teacher Dashboard
                  </Link>
                  <Link
                    href="/teacher/journeys"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    My Journeys
                  </Link>
                  <Link
                    href="/teacher/assignments"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Student Assignments
                  </Link>
                  <Link
                    href="/teacher/progress"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Progress Monitoring
                  </Link>
                  <Link
                    href="/teacher/journeys/create"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg bg-indigo-600 text-white text-center mt-2"
                  >
                    + Create Journey
                  </Link>
                </div>
              )}

              {isStudent && (
                <div className="grid grid-cols-1 gap-1 text-xs font-semibold">
                  <Link
                    href="/student/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Student Dashboard
                  </Link>
                  <Link
                    href="/student/journeys"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    My Assigned Journeys
                  </Link>
                  <Link
                    href="/student/reflections"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Reflections & AI Feedback
                  </Link>
                  <Link
                    href="/student/progress"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Mastery Scorecard
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
