import { PLACES_REFERENCE_DATA, PlaceReference } from '@/lib/data/placesReference';
import { Place } from '@/lib/types/ghoomo';

export interface MatchResult {
  place: PlaceReference;
  confidence: number; // 0.0 to 1.0
  matchReason: 'exact' | 'token_overlap' | 'trigram' | 'alias';
}

/**
 * Normalize text for string comparison: lowercases, removes punctuation, trims spaces.
 */
export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate character trigrams for fuzzy string comparison.
 */
function getTrigrams(str: string): Set<string> {
  const normalized = `  ${normalizeSearchString(str)}  `;
  const trigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Compute Sørensen-Dice coefficient based on trigrams (0.0 to 1.0).
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersection = 0;
  for (const tri of trigramsA) {
    if (trigramsB.has(tri)) {
      intersection++;
    }
  }

  return (2 * intersection) / (trigramsA.size + trigramsB.size);
}

/**
 * Compute word token Jaccard similarity (0.0 to 1.0), ignoring generic noise words.
 */
const STOP_WORDS = new Set([
  'the', 'at', 'in', 'and', 'of', 'for', 'to', 'a', 'an', 'near',
  'best', 'top', 'visit', 'explore', 'reels', 'spot', 'place', 'places'
]);

export function calculateTokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(
    normalizeSearchString(a)
      .split(' ')
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
  );
  const tokensB = new Set(
    normalizeSearchString(b)
      .split(' ')
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
  );

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap++;
    }
  }

  return overlap / Math.max(tokensA.size, tokensB.size);
}

/**
 * Match an input place name (and optional city hint) against the canonical places_reference database.
 */
export function matchPlaceToReference(inputName: string, cityHint?: string): MatchResult | null {
  const normInput = normalizeSearchString(inputName);
  if (!normInput || normInput.length < 3) return null;

  const normCityHint = cityHint ? normalizeSearchString(cityHint) : '';

  let bestMatch: PlaceReference | null = null;
  let highestScore = 0;
  let bestReason: MatchResult['matchReason'] = 'trigram';

  for (const candidate of PLACES_REFERENCE_DATA) {
    const normCandName = normalizeSearchString(candidate.name);
    const normCandCity = normalizeSearchString(candidate.city);
    const normTokens = normalizeSearchString(candidate.search_tokens);

    // City constraint bonus/penalty
    const cityMatches =
      normCityHint &&
      (normCandCity.includes(normCityHint) || normCityHint.includes(normCandCity) || normTokens.includes(normCityHint));

    // 1. Exact Name Match
    if (normInput === normCandName || normCandName.includes(normInput) || normInput.includes(normCandName)) {
      const score = cityMatches ? 0.99 : 0.94;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = candidate;
        bestReason = 'exact';
      }
      continue;
    }

    // 2. Token overlap similarity
    const tokenScore = calculateTokenSimilarity(normInput, candidate.name + ' ' + candidate.search_tokens);
    if (tokenScore >= 0.5) {
      const boostedScore = Math.min(0.95, tokenScore * 0.85 + (cityMatches ? 0.12 : 0));
      if (boostedScore > highestScore) {
        highestScore = boostedScore;
        bestMatch = candidate;
        bestReason = 'token_overlap';
      }
    }

    // 3. Trigram similarity
    const triScore = calculateTrigramSimilarity(normInput, candidate.name);
    if (triScore >= 0.45) {
      const finalTriScore = Math.min(0.92, triScore * 0.85 + (cityMatches ? 0.1 : 0));
      if (finalTriScore > highestScore) {
        highestScore = finalTriScore;
        bestMatch = candidate;
        bestReason = 'trigram';
      }
    }
  }

  // Minimum threshold for confident match
  if (bestMatch && highestScore >= 0.55) {
    return {
      place: bestMatch,
      confidence: Math.round(highestScore * 100) / 100,
      matchReason: bestReason,
    };
  }

  return null;
}

/**
 * Enrich an array of extracted or loosely typed places with canonical reference attributes.
 */
export function enrichPlace(extracted: {
  name: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  category?: string;
  notes?: string;
}): Omit<Place, 'id' | 'tripId' | 'createdAt'> {
  const match = matchPlaceToReference(extracted.name, extracted.city);

  const hasValidExtractedCoords =
    typeof extracted.lat === 'number' &&
    typeof extracted.lng === 'number' &&
    !isNaN(extracted.lat) &&
    !isNaN(extracted.lng) &&
    (extracted.lat !== 0 || extracted.lng !== 0) &&
    // Not default Jaipur unless specifically in Jaipur
    !(extracted.lat === 26.9124 && extracted.lng === 75.7873 && extracted.city && !extracted.city.toLowerCase().includes('jaipur'));

  if (match) {
    return {
      name: match.place.name,
      city: match.place.city,
      state: match.place.state,
      lat: hasValidExtractedCoords ? extracted.lat! : match.place.lat,
      lng: hasValidExtractedCoords ? extracted.lng! : match.place.lng,
      category: extracted.category || match.place.category,
      confidence: match.confidence,
      imageUrl: match.place.image_url,
      notes: extracted.notes || match.place.description,
    };
  }

  return {
    name: extracted.name,
    city: extracted.city || 'India',
    state: extracted.state || 'India',
    lat: hasValidExtractedCoords ? extracted.lat! : 26.9124,
    lng: hasValidExtractedCoords ? extracted.lng! : 75.7873,
    category: extracted.category || 'attraction',
    confidence: 0.85,
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    notes: extracted.notes || 'Discovered from social content',
  };
}

/**
 * Filter reference places by free-text search or city filter for autocomplete/radar.
 */
export function searchPlacesReference(query: string, city?: string, limit = 8): PlaceReference[] {
  const normQuery = normalizeSearchString(query);
  const normCity = city ? normalizeSearchString(city) : '';

  return PLACES_REFERENCE_DATA
    .filter((place) => {
      if (normCity && !normalizeSearchString(place.city).includes(normCity)) {
        return false;
      }
      if (!normQuery) return true;
      const combined = normalizeSearchString(`${place.name} ${place.search_tokens} ${place.category}`);
      return combined.includes(normQuery) || calculateTrigramSimilarity(normQuery, place.name) > 0.35;
    })
    .sort((a, b) => b.popularity_score - a.popularity_score)
    .slice(0, limit);
}
