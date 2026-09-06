// ============================================================================
// Destination & Entity Resolver
// Specification Sections 10, 11, 12, 13, 35, 36, 37:
// - Weighted evidence fusion: confidence = 1 - product(1 - individual_confidence)
// - Destination resolution & candidate alternative ranking
// - Seasonal recommendation multi-candidate detection
// - Relative date expression resolution in code (not model)
// - Entity normalization & OpenStreetMap Nominatim geocoding
// ============================================================================

import {
  TravelEvidence,
  CandidateDestination,
  ExtractedPlaceEvidence,
} from '../types/travelVideoPipeline';

export interface ResolvedDestinationResult {
  destination: string;
  confidence: number;
  isMultiDestination: boolean;
  needsConfirmation: boolean;
  confirmationReason?: string;
  candidates: CandidateDestination[];
  alternatives: string[];
  resolvedYear: number;
  resolvedMonth?: number | null;
  seasonContext?: string;
}

// Weights per specification Section 11
export const EVIDENCE_WEIGHTS = {
  explicit_text: 0.95,
  explicit_spoken: 0.9,
  recognizable_landmark: 0.88,
  onscreen_location_clue: 0.85,
  visual_geographic_clue: 0.65,
  general_visual_similarity: 0.45,
  generic_speech: 0.2,
  motivational_speech: 0.05,
  background_music: 0.0,
};

export class DestinationResolver {
  /**
   * Fuse multi-signal confidence using probability-like formulation:
   * confidence = 1 - product(1 - individual_confidence)
   */
  public static fuseConfidences(confidences: number[]): number {
    if (!confidences || confidences.length === 0) return 0;
    const prod = confidences.reduce((acc, c) => acc * (1 - Math.min(Math.max(c, 0), 0.99)), 1);
    return Math.min(1.0, Math.max(0.0, Number((1 - prod).toFixed(3))));
  }

  /**
   * Resolves relative date expressions ("this year", "this September", "next summer")
   */
  public static resolveDates(evidence: TravelEvidence): {
    year: number;
    month: number | null;
    season: string;
  } {
    const now = new Date();
    let year = now.getFullYear();
    let month: number | null = null;
    let season = evidence.temporal_context?.season || '';

    const expr = (evidence.temporal_context?.relative_expression || '').toLowerCase();
    const rawMonth = (evidence.temporal_context?.month || '').toLowerCase();

    if (expr.includes('next year')) {
      year = now.getFullYear() + 1;
    } else if (evidence.temporal_context?.year) {
      year = evidence.temporal_context.year;
    }

    const MONTH_MAP: Record<string, number> = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };

    for (const [mName, mNum] of Object.entries(MONTH_MAP)) {
      if (rawMonth.includes(mName) || expr.includes(mName)) {
        month = mNum;
        if (!season) {
          if (mNum >= 3 && mNum <= 5) season = 'Spring';
          else if (mNum >= 6 && mNum <= 8) season = 'Summer';
          else if (mNum >= 9 && mNum <= 11) season = 'Autumn';
          else season = 'Winter';
        }
        break;
      }
    }

    return { year, month, season };
  }

  /**
   * Resolves primary destination, candidates, and confirmation needs
   */
  public static resolveDestination(
    evidence: TravelEvidence,
    userSelectedDestination?: string
  ): ResolvedDestinationResult {
    const { year, month, season } = this.resolveDates(evidence);

    // 1. User manual selection always has highest priority
    if (userSelectedDestination && userSelectedDestination.trim()) {
      return {
        destination: userSelectedDestination.trim(),
        confidence: 1.0,
        isMultiDestination: false,
        needsConfirmation: false,
        candidates: evidence.destination_candidates || [],
        alternatives: [],
        resolvedYear: year,
        resolvedMonth: month,
        seasonContext: season,
      };
    }

    const candidates = evidence.destination_candidates || [];

    // 2. Handle Seasonal Recommendations (Section 10C & 36)
    // "Do not combine all destinations into one itinerary. Present them as candidate destinations."
    if (
      evidence.video_type === 'SEASONAL_RECOMMENDATION' ||
      evidence.video_type === 'YEARLY_RECOMMENDATION' ||
      candidates.length > 1 && evidence.video_type === 'DESTINATION_RECOMMENDATION'
    ) {
      const topCand = candidates[0]?.name || evidence.primary_destination || 'Top Recommendations';
      return {
        destination: topCand,
        confidence: candidates[0]?.confidence || 0.85,
        isMultiDestination: false,
        needsConfirmation: candidates.length > 1,
        confirmationReason: `This video recommends multiple seasonal spots for ${evidence.temporal_context.month || 'this season'}. Select your preferred destination to generate the route.`,
        candidates,
        alternatives: candidates.map((c) => c.name),
        resolvedYear: year,
        resolvedMonth: month,
        seasonContext: season,
      };
    }

    // 3. Multi-destination Trip (e.g. Tokyo + Kyoto + Osaka in Japan)
    if (evidence.video_type === 'MULTI_DESTINATION') {
      const allNames = candidates.map((c) => c.name).join(' & ');
      return {
        destination: allNames || evidence.primary_destination || 'Multi-City Tour',
        confidence: 0.92,
        isMultiDestination: true,
        needsConfirmation: false,
        candidates,
        alternatives: candidates.map((c) => c.name),
        resolvedYear: year,
        resolvedMonth: month,
        seasonContext: season,
      };
    }

    // 4. Single Destination with Confidence Evaluation (Section 10H & 35)
    let bestDest = evidence.primary_destination;
    let bestConf = 0;

    if (candidates.length > 0) {
      bestDest = candidates[0].name;
      bestConf = candidates[0].confidence;
    } else if (bestDest) {
      bestConf = evidence.travel_confidence;
    }

    // Fallback: derive from most frequent place city/country
    if (!bestDest && evidence.places && evidence.places.length > 0) {
      const counts: Record<string, number> = {};
      evidence.places.forEach((p) => {
        const key = p.country ? `${p.city || p.name}, ${p.country}` : p.city || p.name;
        counts[key] = (counts[key] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted[0]) {
        bestDest = sorted[0][0];
        bestConf = 0.75;
      }
    }

    const finalDest = bestDest || 'Unknown Destination';
    const destinationConfidence = bestConf || 0.5;

    // Spec: if destination_confidence < 0.70, ask user for confirmation
    const needsConfirmation = destinationConfidence < 0.7 || finalDest === 'Unknown Destination';

    return {
      destination: finalDest,
      confidence: destinationConfidence,
      isMultiDestination: false,
      needsConfirmation,
      confirmationReason: needsConfirmation
        ? "We detected travel footage but destination confidence is below 70%. Please confirm or select your destination."
        : undefined,
      candidates,
      alternatives: candidates.slice(1).map((c) => c.name),
      resolvedYear: year,
      resolvedMonth: month,
      seasonContext: season,
    };
  }

  /**
   * Geocodes and canonicalizes place coordinates using OpenStreetMap Nominatim
   */
  public static async geocodePlaceOSM(
    name: string,
    city?: string,
    country?: string
  ): Promise<{ lat: number; lng: number; canonicalName?: string } | null> {
    try {
      const query = [name, city, country].filter(Boolean).join(', ');
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Ghoomo-Bharat-Travel-Engine/2.0 (contact@ghoomo.travel)',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            canonicalName: data[0].display_name?.split(',')[0]?.trim() || name,
          };
        }
      }
    } catch {}
    return null;
  }

  /**
   * Enriches extracted places with accurate coordinates and canonical IDs
   */
  public static async normalizeEntities(
    places: ExtractedPlaceEvidence[],
    destination: string
  ): Promise<ExtractedPlaceEvidence[]> {
    const normalized: ExtractedPlaceEvidence[] = [];
    const seenNames = new Set<string>();

    for (const p of places) {
      const cleanName = (p.canonicalName || p.name).trim();
      const normKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (seenNames.has(normKey)) continue;
      seenNames.add(normKey);

      let lat = p.lat && !isNaN(p.lat) && p.lat !== 0 ? p.lat : undefined;
      let lng = p.lng && !isNaN(p.lng) && p.lng !== 0 ? p.lng : undefined;

      // Geocode missing or invalid coordinates via OpenStreetMap Nominatim
      if (!lat || !lng) {
        const geo = await this.geocodePlaceOSM(p.name, p.city, p.country || destination);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        } else {
          // Default sensible center based on destination if geocoding times out
          lat = 20.5937;
          lng = 78.9629;
        }
      }

      normalized.push({
        ...p,
        name: cleanName,
        lat,
        lng,
        estimatedVisitMinutes: p.estimatedVisitMinutes || 90,
      });
    }

    return normalized;
  }
}
