'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Sun,
  Moon,
  Menu,
  X,
  LogIn,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import GhoomoLogo from '@/components/shared/GhoomoLogo';

import { useUIStore } from '@/stores/useUIStore';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const { openAuthModal } = useUIStore();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // If in /app authenticated views, TopBar handles navigation within AppShell
  const isDedicatedAppLayout = pathname.startsWith('/app');

  if (isDedicatedAppLayout) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <GhoomoLogo size="sm" showSubtitle={true} subtitle="Smart Learning Guide" />
        </Link>

        {/* Center Navigation - Public Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            About
          </Link>
          <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {isAuthenticated ? (
            <Link href="/app">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-xs">
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuthModal('sign-in')}
                className="text-xs h-9 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => openAuthModal('sign-up')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-xs"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setIsMobileOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setIsMobileOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            About
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsMobileOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            Contact
          </Link>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            {isAuthenticated ? (
              <Link href="/app" className="w-full">
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileOpen(false);
                    openAuthModal('sign-in');
                  }}
                  className="flex-1 text-xs h-9"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsMobileOpen(false);
                    openAuthModal('sign-up');
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
