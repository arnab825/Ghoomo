/**
 * Ghoomo Resource Ranker & Classifier
 * Classifies learning resources into authoritative categories:
 * - Learn: In-depth tutorial / conceptual article
 * - Watch: Video lecture / walkthrough
 * - Reference: Official specification or documentation
 * - Practice: Interactive problem set or sandbox
 * - Deep Dive: Research paper, architecture breakdown, or advanced chapter
 * - Build: Hands-on implementation project or challenge
 *
 * Ranks candidates using domain authority, topic relevance, and learner level.
 */

import { CuratedResource } from '@/lib/types/engine';
import { validateResourceUrl } from './resourceValidator';

export type ResourceCategory = 'learn' | 'watch' | 'reference' | 'practice' | 'deep_dive' | 'build';

export interface ScoredResource extends CuratedResource {
  category: ResourceCategory;
  authorityScore: number;
  relevanceScore: number;
  overallScore: number;
}

// Domain authority multipliers (0.0 - 1.0)
const DOMAIN_AUTHORITY: Record<string, number> = {
  'python.org': 1.0,
  'docs.python.org': 1.0,
  'developer.mozilla.org': 1.0,
  'react.dev': 1.0,
  'nextjs.org': 0.95,
  'typescriptlang.org': 1.0,
  'ocw.mit.edu': 0.98,
  'stanford.edu': 0.98,
  'princeton.edu': 0.95,
  'huggingface.co': 0.96,
  'pytorch.org': 0.98,
  'scikit-learn.org': 0.98,
  'realpython.com': 0.92,
  'javascript.info': 0.94,
  'freecodecamp.org': 0.90,
  'refactoring.guru': 0.90,
  'martinfowler.com': 0.92,
  'cp-algorithms.com': 0.94,
  'leetcode.com': 0.88,
  'neetcode.io': 0.88,
  'geeksforgeeks.org': 0.78,
  'youtube.com': 0.85,
  'youtu.be': 0.85,
  'github.com': 0.86,
  'dev.to': 0.72,
};

/**
 * Automatically classifies a resource into one of the 6 canonical categories.
 */
export function classifyResourceCategory(resource: {
  url: string;
  title: string;
  platform?: string;
  description?: string;
}): ResourceCategory {
  const urlLower = resource.url.toLowerCase();
  const titleLower = resource.title.toLowerCase();
  const descLower = (resource.description || '').toLowerCase();

  // 1. Watch (Videos)
  if (
    urlLower.includes('youtube.com') ||
    urlLower.includes('youtu.be') ||
    urlLower.includes('vimeo.com') ||
    titleLower.includes('video') ||
    titleLower.includes('lecture') ||
    titleLower.includes('crash course')
  ) {
    return 'watch';
  }

  // 2. Reference (Official Documentation)
  if (
    urlLower.includes('docs.') ||
    urlLower.includes('/docs/') ||
    urlLower.includes('/documentation/') ||
    urlLower.includes('/tutorial/datastructures') ||
    urlLower.includes('developer.mozilla.org') ||
    urlLower.includes('react.dev/reference') ||
    titleLower.includes('documentation') ||
    titleLower.includes('official doc') ||
    titleLower.includes('specification')
  ) {
    return 'reference';
  }

  // 3. Practice (Problem Sets, Sandboxes, Drills)
  if (
    urlLower.includes('leetcode.com') ||
    urlLower.includes('neetcode.io') ||
    urlLower.includes('hackerrank.com') ||
    urlLower.includes('codewars.com') ||
    urlLower.includes('/problems/') ||
    urlLower.includes('exercises') ||
    titleLower.includes('practice') ||
    titleLower.includes('exercises') ||
    titleLower.includes('drills') ||
    titleLower.includes('problems')
  ) {
    return 'practice';
  }

  // 4. Build (Projects / System Building)
  if (
    titleLower.includes('build a') ||
    titleLower.includes('project') ||
    titleLower.includes('from scratch') ||
    titleLower.includes('implementation') ||
    descLower.includes('hands-on project') ||
    urlLower.includes('github.com/practical')
  ) {
    return 'build';
  }

  // 5. Deep Dive (Advanced Papers / In-depth Systems)
  if (
    urlLower.includes('arxiv.org') ||
    urlLower.includes('martinfowler.com') ||
    urlLower.includes('refactoring.guru') ||
    titleLower.includes('deep dive') ||
    titleLower.includes('under the hood') ||
    titleLower.includes('internals') ||
    titleLower.includes('advanced') ||
    titleLower.includes('architecture')
  ) {
    return 'deep_dive';
  }

  // 6. Default: Learn (Article / Tutorial)
  return 'learn';
}

/**
 * Calculates domain authority score (0.0 to 1.0).
 */
export function getDomainAuthority(domain: string): number {
  const norm = domain.toLowerCase().replace(/^www\./, '');
  for (const [knownDomain, score] of Object.entries(DOMAIN_AUTHORITY)) {
    if (norm === knownDomain || norm.endsWith(`.${knownDomain}`)) {
      return score;
    }
  }
  return 0.65; // baseline unclassified educational site
}

/**
 * Calculates topic relevance score based on keyword overlap.
 */
export function computeRelevanceScore(
  resource: { title: string; description?: string; url: string },
  topicName: string
): number {
  const topicTokens = topicName.toLowerCase().split(/[\s-_]+/).filter((t) => t.length > 2);
  if (topicTokens.length === 0) return 0.75;

  const contentText = `${resource.title} ${resource.description || ''} ${resource.url}`.toLowerCase();
  let matches = 0;

  for (const token of topicTokens) {
    if (contentText.includes(token)) {
      matches += 1;
    }
  }

  const tokenRatio = matches / topicTokens.length;
  // Exact phrase match bonus
  const exactMatchBonus = contentText.includes(topicName.toLowerCase()) ? 0.25 : 0;

  return Math.min(1.0, 0.4 + tokenRatio * 0.4 + exactMatchBonus);
}

/**
 * Ranks and sorts candidate resources.
 */
export function rankAndOrganizeResources(
  candidates: CuratedResource[],
  topicName: string
): ScoredResource[] {
  const scored: ScoredResource[] = [];

  for (const res of candidates) {
    const validation = validateResourceUrl(res.url);
    if (!validation.isValid) continue;

    const category = classifyResourceCategory({
      url: validation.sanitizedUrl,
      title: res.title,
      platform: res.platform,
      description: res.description,
    });

    const authorityScore = getDomainAuthority(validation.domain);
    const relevanceScore = computeRelevanceScore(res, topicName);
    const overallScore = Number((authorityScore * 0.5 + relevanceScore * 0.5).toFixed(2));

    scored.push({
      ...res,
      url: validation.sanitizedUrl,
      category,
      authorityScore,
      relevanceScore,
      overallScore,
    });
  }

  // Sort descending by overall score
  return scored.sort((a, b) => b.overallScore - a.overallScore);
}
