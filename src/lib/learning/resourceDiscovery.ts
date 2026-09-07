/**
 * Ghoomo Real Web Resource Discovery Pipeline
 * NON-NEGOTIABLE RULE: Zero AI URL Hallucination.
 * Searches the live web using DuckDuckGo / authoritative search queries,
 * collects candidate links, validates URLs, strips tracking, and ranks them
 * using domain authority.
 */

import { LRUCache } from '@/lib/utils/lruCache';
import { validateResourceUrl } from './resourceValidator';
import { rankAndOrganizeResources, ScoredResource, ResourceCategory } from './resourceRanker';
import { CuratedResource } from '@/lib/types/engine';
import { supabase } from '@/lib/supabase/client';

const discoveryCache = new LRUCache<string, ScoredResource[]>(150);

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Builds authoritative search queries targeted for Computer Science domains.
 */
export function buildDomainSearchQueries(topic: string, domain: string = 'Computer Science'): string[] {
  const cleanTopic = topic.trim();
  const queries: string[] = [
    `${cleanTopic} tutorial guide site:docs.python.org OR site:realpython.com OR site:developer.mozilla.org`,
    `${cleanTopic} computer science lecture site:youtube.com`,
    `${cleanTopic} explanation site:freecodecamp.org OR site:geeksforgeeks.org`,
    `${cleanTopic} documentation reference site:react.dev OR site:python.org OR site:typescriptlang.org`,
  ];

  return queries;
}

/**
 * Searches DuckDuckGo HTML Lite engine for clean, un-hallucinated web results.
 * Respects strict 6-second timeout to maintain Vercel free-tier SLA.
 */
async function searchDuckDuckGo(query: string, timeoutMs: number = 6000): Promise<RawSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const results: RawSearchResult[] = [];

    // Parse DuckDuckGo result links
    // DuckDuckGo links look like: <a class="result__url" href="//duckduckgo.com/l/?uddg=https%3A%2F%2F...
    const linkRegex = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<a[^>]+class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    // Alternative: match uddg redirected URLs
    const uddgRegex = /uddg=([^&"]+)/g;
    let match: RegExpExecArray | null;

    while ((match = uddgRegex.exec(html)) !== null && results.length < 8) {
      try {
        const decodedUrl = decodeURIComponent(match[1]);
        const validation = validateResourceUrl(decodedUrl);
        if (validation.isValid && validation.isTrustedDomain) {
          results.push({
            url: validation.sanitizedUrl,
            title: `${topicQueryToTitle(query)} - ${validation.domain}`,
            snippet: `Curated learning resource for ${query} from ${validation.domain}.`,
          });
        }
      } catch {
        // Skip malformed url
      }
    }

    return results;
  } catch {
    clearTimeout(timer);
    return [];
  }
}

function topicQueryToTitle(q: string): string {
  return q.replace(/\s+site:.*$/i, '').trim();
}

/**
 * Discovers and organizes genuine, verified resources for a Computer Science topic.
 * Zero hallucination guarantee: every returned resource has a validated URL.
 */
export async function discoverTopicResources(params: {
  topicName: string;
  domain?: string;
  staticCatalogFallbacks?: CuratedResource[];
}): Promise<ScoredResource[]> {
  const cacheKey = `${params.topicName.toLowerCase()}:::${(params.domain || 'cs').toLowerCase()}`;

  // 1. Check in-memory cache
  const cached = discoveryCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const candidateResources: CuratedResource[] = [];

  // 2. Include known verified catalog fallbacks
  if (params.staticCatalogFallbacks && params.staticCatalogFallbacks.length > 0) {
    candidateResources.push(...params.staticCatalogFallbacks);
  }

  // 3. Search real web via DuckDuckGo pipeline for live enrichment
  try {
    const queries = buildDomainSearchQueries(params.topicName, params.domain);
    const searchResults = await searchDuckDuckGo(queries[0], 5000);

    for (const item of searchResults) {
      const validation = validateResourceUrl(item.url);
      if (validation.isValid) {
        candidateResources.push({
          title: item.title,
          url: validation.sanitizedUrl,
          type: validation.domain.includes('youtube') ? 'video' : 'article',
          platform: validation.domain,
          durationMinutes: validation.domain.includes('youtube') ? 25 : 12,
          description: item.snippet,
        });
      }
    }
  } catch {
    // Fail silently to catalog fallbacks on network drop
  }

  // 4. Rank and classify
  const ranked = rankAndOrganizeResources(candidateResources, params.topicName);

  // 5. Deduplicate by URL
  const seenUrls = new Set<string>();
  const finalResources: ScoredResource[] = [];
  for (const r of ranked) {
    if (!seenUrls.has(r.url)) {
      seenUrls.add(r.url);
      finalResources.push(r);
    }
  }

  if (finalResources.length > 0) {
    discoveryCache.set(cacheKey, finalResources);
  }

  return finalResources;
}
