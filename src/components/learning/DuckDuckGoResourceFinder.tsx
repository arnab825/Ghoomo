'use client';

import React, { useState, useEffect } from 'react';
import {
  searchDuckDuckGoResourcesAction,
  DuckDuckGoResourceResult,
} from '@/app/actions/resourceActions';
import {
  Search,
  ExternalLink,
  BookOpen,
  PlayCircle,
  FileCode,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface DuckDuckGoResourceFinderProps {
  conceptName: string;
  domain?: string;
}

export default function DuckDuckGoResourceFinder({
  conceptName,
  domain = 'Computer Science',
}: DuckDuckGoResourceFinderProps) {
  const [query, setQuery] = useState(conceptName);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DuckDuckGoResourceResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search on initial concept load
  useEffect(() => {
    let isMounted = true;
    async function initSearch() {
      if (!conceptName) return;
      setIsSearching(true);
      setQuery(conceptName);
      try {
        const res = await searchDuckDuckGoResourcesAction(`${conceptName} ${domain} tutorial`);
        if (isMounted && res.success) {
          setResults(res.results);
          setHasSearched(true);
        }
      } catch (e) {
        console.error('DuckDuckGo search error:', e);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }

    initSearch();
    return () => {
      isMounted = false;
    };
  }, [conceptName, domain]);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const res = await searchDuckDuckGoResourcesAction(query.trim());
      if (res.success) {
        setResults(res.results);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('Failed to query DuckDuckGo:', err);
    } finally {
      setIsSearching(false);
    }
  }

  // Preset shortcut links to open DuckDuckGo directly
  const quickLinks = [
    {
      label: 'Official Docs',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(conceptName + ' documentation official guide')}`,
    },
    {
      label: 'Cheat Sheet',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(conceptName + ' cheat sheet syntax summary')}`,
    },
    {
      label: 'Practice Problems',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(conceptName + ' practice exercises problems leetcode')}`,
    },
    {
      label: 'Video Masterclass',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(conceptName + ' tutorial lecture youtube')}`,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      {/* DuckDuckGo Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0 border border-amber-500/30">
            🦆
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-heading">
              <span>DuckDuckGo Discovery</span>
              <span className="text-3xs uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Live Web
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search materials via DuckDuckGo..."
          className="w-full pl-8 pr-20 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-saffron-500 transition-all"
        />
        <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-1.5 px-2.5 py-1 text-3xs font-semibold rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white transition-colors disabled:opacity-50"
        >
          {isSearching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* Quick-Search Filter Chips */}
      <div>
        <div className="text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          One-Click DuckDuckGo Queries
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickLinks.map((ql, idx) => (
            <a
              key={idx}
              href={ql.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-3xs font-medium bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700/60 transition-colors"
            >
              <span>{ql.label}</span>
              <ExternalLink size={10} className="opacity-70" />
            </a>
          ))}
        </div>
      </div>

      {/* Discovered Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-3xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Authoritative Materials Found</span>
          {results.length > 0 && <span>{results.length} results</span>}
        </div>

        {isSearching && results.length === 0 ? (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin text-saffron-500" />
            <span>Finding authoritative web resources...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.slice(0, 6).map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-saffron-500 hover:shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-saffron-500 shrink-0 mt-0.5">
                      {item.type === 'video' ? (
                        <PlayCircle size={13} />
                      ) : item.type === 'docs' ? (
                        <FileCode size={13} />
                      ) : (
                        <BookOpen size={13} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors line-clamp-1">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-3xs font-medium text-slate-400">
                          {item.domain}
                        </span>
                        <span className="text-3xs px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-saffron-500 shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        ) : hasSearched ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
            No direct links found for &quot;{query}&quot;. Try one of the one-click DuckDuckGo queries above.
          </div>
        ) : null}

        {/* Deep Search Footer */}
        <div className="pt-1">
          <a
            href={`https://duckduckgo.com/?q=${encodeURIComponent(conceptName + ' programming tutorial documentation')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-3xs font-semibold text-slate-500 hover:text-saffron-600 dark:hover:text-saffron-400 transition-colors"
          >
            <span>Search more on DuckDuckGo</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
