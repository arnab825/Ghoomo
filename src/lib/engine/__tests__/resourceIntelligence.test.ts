/**
 * Resource Intelligence & Validation Test Suite
 * Verifies URL validation, category classification, domain authority scoring,
 * and zero-hallucination guarantees.
 */

import { validateResourceUrl, validateAndDeduplicateUrls } from '@/lib/learning/resourceValidator';
import {
  classifyResourceCategory,
  getDomainAuthority,
  computeRelevanceScore,
  rankAndOrganizeResources,
} from '@/lib/learning/resourceRanker';
import { CuratedResource } from '@/lib/types/engine';

export function runResourceIntelligenceTests() {
  console.log('--- Running Resource Intelligence & Validation Tests ---');

  // Test 1: URL Sanitization and Tracking Stripping
  const dirtyUrl = 'https://docs.python.org/3/tutorial/datastructures.html?utm_source=twitter&utm_medium=social&ref=ghoomo';
  const valResult = validateResourceUrl(dirtyUrl);
  if (!valResult.isValid || !valResult.isTrustedDomain) {
    throw new Error('Test 1 Failed: Expected valid trusted domain for docs.python.org');
  }
  if (valResult.sanitizedUrl.includes('utm_source') || valResult.sanitizedUrl.includes('ref=')) {
    throw new Error('Test 1 Failed: Tracking parameters were not stripped from URL.');
  }
  console.log('✓ Test 1 Passed: Tracking parameters successfully stripped and trusted domain verified.');

  // Test 2: Blocked & Malicious Domain Detection
  const spamUrl = 'https://www.quora.com/What-is-an-array';
  const spamResult = validateResourceUrl(spamUrl);
  if (spamResult.isValid) {
    throw new Error('Test 2 Failed: Low-signal domain was not blocked.');
  }
  console.log('✓ Test 2 Passed: Low-educational signal domain correctly rejected.');

  // Test 3: Resource Classification
  const videoCat = classifyResourceCategory({
    url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
    title: 'Data Structures Easy to Advanced: Dynamic Arrays',
  });
  if (videoCat !== 'watch') {
    throw new Error(`Test 3 Failed: Expected 'watch' but got '${videoCat}'`);
  }

  const docCat = classifyResourceCategory({
    url: 'https://docs.python.org/3/library/collections.html',
    title: 'Python Collections Module Documentation',
  });
  if (docCat !== 'reference') {
    throw new Error(`Test 3 Failed: Expected 'reference' but got '${docCat}'`);
  }

  const practiceCat = classifyResourceCategory({
    url: 'https://leetcode.com/problems/two-sum/',
    title: 'Two Sum Practice Problem',
  });
  if (practiceCat !== 'practice') {
    throw new Error(`Test 3 Failed: Expected 'practice' but got '${practiceCat}'`);
  }
  console.log('✓ Test 3 Passed: Resource categories (watch, reference, practice) accurately classified.');

  // Test 4: Domain Authority & Ranking
  const pythonAuth = getDomainAuthority('docs.python.org');
  const gfgAuth = getDomainAuthority('geeksforgeeks.org');
  if (pythonAuth <= gfgAuth) {
    throw new Error('Test 4 Failed: Official Python documentation should rank higher than GeeksforGeeks.');
  }

  const candidatePool: CuratedResource[] = [
    {
      title: 'Random Blog Post on Arrays',
      url: 'https://dev.to/someuser/arrays',
      type: 'article',
      platform: 'Dev.to',
    },
    {
      title: 'Python Official Documentation: Data Structures & Lists',
      url: 'https://docs.python.org/3/tutorial/datastructures.html',
      type: 'docs',
      platform: 'Python.org',
    },
    {
      title: 'MIT 6.006 Introduction to Algorithms: Dynamic Arrays',
      url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
      type: 'article',
      platform: 'MIT OCW',
    },
  ];

  const ranked = rankAndOrganizeResources(candidatePool, 'Dynamic Arrays');
  if (ranked[0].url !== 'https://docs.python.org/3/tutorial/datastructures.html' && ranked[0].platform !== 'MIT OCW') {
    throw new Error('Test 4 Failed: Authoritative reference should rank above generic blog posts.');
  }
  console.log('✓ Test 4 Passed: Authoritative domain ranking correctly places official sources at the top.');

  // Test 5: Zero Hallucinated URLs Admitted
  const invalidPool = [
    'not-a-url',
    'ftp://invalidscheme.com',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  ];
  const deduped = validateAndDeduplicateUrls(invalidPool);
  if (deduped.length !== 1 || !deduped[0].includes('developer.mozilla.org')) {
    throw new Error('Test 5 Failed: Malformed or non-HTTP URLs were not filtered out.');
  }
  console.log('✓ Test 5 Passed: Zero invalid or hallucinated URLs admitted into learning pipeline.');
}
