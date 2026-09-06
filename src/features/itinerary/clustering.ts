import { Place, ItineraryDay, ItineraryItem, TimeSlot } from '@/lib/types/ghoomo';

// Calculate Haversine distance between two coordinates in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return R * c;
}

export function generateProximityItinerary(
  places: Place[],
  durationDays: number,
  tripId: string
): { days: ItineraryDay[]; updatedPlaces: Place[] } {
  if (places.length === 0) {
    const emptyDays: ItineraryDay[] = Array.from({ length: durationDays }, (_, i) => ({
      id: `day-${i + 1}-${Date.now()}`,
      tripId,
      dayNumber: i + 1,
      theme: `Day ${i + 1}: Exploration & Local Culture`,
      items: [],
    }));
    return { days: emptyDays, updatedPlaces: [] };
  }

  // Clone places to avoid side-effects
  const unassigned = [...places];
  const daysCount = Math.max(1, durationDays);
  const slots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];

  const days: ItineraryDay[] = Array.from({ length: daysCount }, (_, i) => ({
    id: `day-${i + 1}-${Date.now()}`,
    tripId,
    dayNumber: i + 1,
    theme: `Day ${i + 1}: ${unassigned[i]?.city || 'Local'} Highlights`,
    items: [],
  }));

  const updatedPlacesMap = new Map<string, Place>();

  // Simple k-means/greedy clustering:
  // For each day, pick an anchor place, then add the nearest unassigned places
  for (let dayIndex = 0; dayIndex < daysCount; dayIndex++) {
    if (unassigned.length === 0) break;

    // Pick first unassigned place as day anchor
    const anchor = unassigned.shift()!;
    const dayPlaces: Place[] = [anchor];

    // Determine target places per day (e.g. 2-4 places)
    const targetCount = Math.ceil((unassigned.length + 1) / (daysCount - dayIndex));
    const placesToTake = Math.min(targetCount - 1, unassigned.length);

    if (placesToTake > 0) {
      // Sort remaining places by distance to anchor
      unassigned.sort((a, b) => {
        const distA = calculateDistanceKm(anchor.lat, anchor.lng, a.lat, a.lng);
        const distB = calculateDistanceKm(anchor.lat, anchor.lng, b.lat, b.lng);
        return distA - distB;
      });

      for (let k = 0; k < placesToTake; k++) {
        const nearest = unassigned.shift();
        if (nearest) {
          dayPlaces.push(nearest);
        }
      }
    }

    // Assign time slots & generate itinerary items for this day
    const day = days[dayIndex];
    day.theme = `Day ${day.dayNumber}: ${dayPlaces[0].name} & Nearby Sights`;

    dayPlaces.forEach((p, idx) => {
      const slot = slots[Math.min(idx, slots.length - 1)];
      const updatedPlace: Place = {
        ...p,
        assignedDay: day.dayNumber,
        timeSlot: slot,
      };
      updatedPlacesMap.set(updatedPlace.id, updatedPlace);

      const item: ItineraryItem = {
        id: `item-${day.dayNumber}-${idx}-${Date.now()}`,
        dayId: day.id,
        placeId: updatedPlace.id,
        orderIndex: idx,
        timeSlot: slot,
        durationMinutes: idx === 0 ? 120 : 90,
        notes: `Proximity matched • ${updatedPlace.category}`,
        place: updatedPlace,
      };
      day.items.push(item);
    });
  }

  // Any remaining leftover places (if more places than days can comfortably hold) stay in radar
  unassigned.forEach((p) => {
    updatedPlacesMap.set(p.id, { ...p, assignedDay: undefined, timeSlot: undefined });
  });

  const updatedPlaces = places.map((p) => updatedPlacesMap.get(p.id) || p);

  return { days, updatedPlaces };
}
