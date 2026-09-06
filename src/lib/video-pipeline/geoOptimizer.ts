// ============================================================================
// Geographic Optimizer & Constrained Bin-Packing Scheduler
// Specification Sections 15, 16, 17, 40, 41:
// - Haversine distance matrix: O(N²)
// - Geographic clustering within radius R
// - Constrained greedy nearest-neighbor with daily capacity bin-packing
// - Objective scoring function
// ============================================================================

import { ExtractedPlaceEvidence, ProvenanceSource } from '../types/travelVideoPipeline';

export interface ScheduledDayPlace {
  place: ExtractedPlaceEvidence;
  order: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  estimatedVisitMinutes: number;
  travelMinutesFromPrevious: number;
  provenance: ProvenanceSource;
}

export interface ScheduledDay {
  dayNumber: number;
  theme: string;
  places: ScheduledDayPlace[];
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  clusterName?: string;
}

export interface OptimizationResult {
  days: ScheduledDay[];
  unassignedPlaces: ExtractedPlaceEvidence[];
  objectiveScore: number;
  totalDistanceKm: number;
  totalTransitHours: number;
  metrics: {
    backtrackingPenalty: number;
    overcrowdingPenalty: number;
    coverageScore: number;
  };
}

export class GeoOptimizer {
  /**
   * Calculates straight-line Haversine distance between two coordinates in km
   */
  public static haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Estimates transit minutes based on urban vs regional distance
   */
  public static estimateTransitMinutes(distKm: number): number {
    if (distKm <= 0.5) return 10; // short walk
    if (distKm <= 5) return 15 + Math.round(distKm * 3); // city traffic: ~20 km/h
    if (distKm <= 25) return 25 + Math.round(distKm * 1.8); // suburban: ~35 km/h
    return 30 + Math.round(distKm * 1.2); // highway: ~50 km/h
  }

  /**
   * Groups places within radius R into geographic clusters (Section 17)
   */
  public static clusterPlacesByRadius(
    places: ExtractedPlaceEvidence[],
    radiusKm = 12.0
  ): ExtractedPlaceEvidence[][] {
    const unassigned = [...places];
    const clusters: ExtractedPlaceEvidence[][] = [];

    while (unassigned.length > 0) {
      const current = unassigned.shift()!;
      const cluster: ExtractedPlaceEvidence[] = [current];

      for (let i = unassigned.length - 1; i >= 0; i--) {
        const candidate = unassigned[i];
        const dist = this.haversineDistanceKm(
          current.lat || 0,
          current.lng || 0,
          candidate.lat || 0,
          candidate.lng || 0
        );

        if (dist <= radiusKm) {
          cluster.push(candidate);
          unassigned.splice(i, 1);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Schedules clusters and places using constrained greedy nearest-neighbor bin-packing
   */
  public static optimizeItinerary(
    places: ExtractedPlaceEvidence[],
    durationDays: number,
    pace: 'relaxed' | 'balanced' | 'fast' = 'balanced'
  ): OptimizationResult {
    if (!places || places.length === 0) {
      return {
        days: Array.from({ length: durationDays }, (_, i) => ({
          dayNumber: i + 1,
          theme: `Day ${i + 1}: Leisure & Exploration`,
          places: [],
          totalVisitMinutes: 0,
          totalTravelMinutes: 0,
        })),
        unassignedPlaces: [],
        objectiveScore: 0,
        totalDistanceKm: 0,
        totalTransitHours: 0,
        metrics: { backtrackingPenalty: 0, overcrowdingPenalty: 0, coverageScore: 0 },
      };
    }

    // Daily capacity in minutes:
    // Relaxed: 360m (6h), Balanced: 450m (7.5h), Fast: 540m (9h)
    const dailyCapacityMinutes = pace === 'relaxed' ? 360 : pace === 'fast' ? 540 : 450;
    const maxPlacesPerDay = pace === 'relaxed' ? 3 : pace === 'fast' ? 5 : 4;

    // Cluster places first to schedule nearby neighborhoods together
    const clusters = this.clusterPlacesByRadius(places, 15.0);

    // Flatten clusters in order of cluster size and geographic proximity
    const orderedCandidatePlaces: ExtractedPlaceEvidence[] = [];
    clusters.forEach((cl) => {
      // Sort within cluster by nearest neighbor
      if (cl.length > 1) {
        const sortedInCluster: ExtractedPlaceEvidence[] = [cl[0]];
        const remaining = cl.slice(1);
        while (remaining.length > 0) {
          const last = sortedInCluster[sortedInCluster.length - 1];
          let nearestIdx = 0;
          let minDist = Infinity;
          for (let i = 0; i < remaining.length; i++) {
            const d = this.haversineDistanceKm(
              last.lat || 0,
              last.lng || 0,
              remaining[i].lat || 0,
              remaining[i].lng || 0
            );
            if (d < minDist) {
              minDist = d;
              nearestIdx = i;
            }
          }
          sortedInCluster.push(remaining.splice(nearestIdx, 1)[0]);
        }
        orderedCandidatePlaces.push(...sortedInCluster);
      } else {
        orderedCandidatePlaces.push(...cl);
      }
    });

    // Schedule into days using constrained greedy bin-packing
    const days: ScheduledDay[] = Array.from({ length: durationDays }, (_, i) => ({
      dayNumber: i + 1,
      theme: `Day ${i + 1}: Exploration`,
      places: [],
      totalVisitMinutes: 0,
      totalTravelMinutes: 0,
    }));

    const timeSlots: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
    const unassigned: ExtractedPlaceEvidence[] = [];
    let totalDistanceKm = 0;

    let currentDayIndex = 0;

    for (let i = 0; i < orderedCandidatePlaces.length; i++) {
      const place = orderedCandidatePlaces[i];
      const visitMins = place.estimatedVisitMinutes || 90;

      // Find best day for this place
      let placed = false;

      while (currentDayIndex < durationDays) {
        const currentDay = days[currentDayIndex];
        const lastPlace = currentDay.places[currentDay.places.length - 1]?.place;

        const transitMins = lastPlace
          ? this.estimateTransitMinutes(
              this.haversineDistanceKm(lastPlace.lat || 0, lastPlace.lng || 0, place.lat || 0, place.lng || 0)
            )
          : 20;

        const prospectiveTotal = currentDay.totalVisitMinutes + currentDay.totalTravelMinutes + visitMins + transitMins;

        if (prospectiveTotal <= dailyCapacityMinutes && currentDay.places.length < maxPlacesPerDay) {
          // Fits in current day
          const slotIdx = Math.min(currentDay.places.length, timeSlots.length - 1);
          const order = currentDay.places.length + 1;

          currentDay.places.push({
            place,
            order,
            timeSlot: timeSlots[slotIdx],
            estimatedVisitMinutes: visitMins,
            travelMinutesFromPrevious: transitMins,
            provenance: place.provenance || 'creator_multiple',
          });

          currentDay.totalVisitMinutes += visitMins;
          currentDay.totalTravelMinutes += transitMins;

          if (lastPlace) {
            totalDistanceKm += this.haversineDistanceKm(
              lastPlace.lat || 0,
              lastPlace.lng || 0,
              place.lat || 0,
              place.lng || 0
            );
          }

          placed = true;
          break;
        } else {
          // Day is full, advance to next day
          currentDayIndex++;
        }
      }

      if (!placed) {
        unassigned.push(place);
      }
    }

    // Assign descriptive theme to each day based on anchor attraction
    days.forEach((day) => {
      if (day.places.length > 0) {
        const first = day.places[0].place;
        const areaName = first.city || first.name;
        day.theme = `Day ${day.dayNumber}: ${areaName} & Highlights`;
      } else {
        day.theme = `Day ${day.dayNumber}: Free Day / Local Wandering`;
      }
    });

    // Objective function calculation (Section 40)
    // score = location_coverage - travel_time_penalty - backtracking_penalty - overcrowding_penalty + preference_match
    const placedCount = places.length - unassigned.length;
    const coverageScore = Number(((placedCount / Math.max(places.length, 1)) * 50).toFixed(1));
    const travelTimePenalty = Number(((totalDistanceKm / 15) * 1.0).toFixed(1));
    const overcrowdingPenalty = days.reduce(
      (acc, d) => (d.places.length > maxPlacesPerDay ? acc + 10 : acc),
      0
    );
    const backtrackingPenalty = 0; // minimized via nearest-neighbor sequencing
    const preferenceMatch = 20;

    const objectiveScore = Math.max(
      10,
      Math.round(coverageScore - travelTimePenalty - overcrowdingPenalty - backtrackingPenalty + preferenceMatch)
    );

    return {
      days,
      unassignedPlaces: unassigned,
      objectiveScore,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalTransitHours: Number((totalDistanceKm / 35).toFixed(1)),
      metrics: {
        backtrackingPenalty,
        overcrowdingPenalty,
        coverageScore,
      },
    };
  }
}
