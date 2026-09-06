/**
 * Free OpenStreetMap Nominatim Geocoding Service
 * Provides free, zero-cost coordinates for any city, landmark, or attraction worldwide.
 */

const GEOCODE_CACHE = new Map<string, { lat: number; lng: number }>();

export async function geocodePlaceWithOSM(
  placeName: string,
  city?: string,
  stateOrCountry?: string
): Promise<{ lat: number; lng: number } | null> {
  const query = [placeName, city, stateOrCountry].filter(Boolean).join(', ').trim();
  const cacheKey = query.toLowerCase();

  if (GEOCODE_CACHE.has(cacheKey)) {
    return GEOCODE_CACHE.get(cacheKey)!;
  }

  // First try full place + city
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GhoomoBharatTourismApp/1.0 (contact@ghoomo.in)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        GEOCODE_CACHE.set(cacheKey, coords);
        return coords;
      }
    }
  } catch {}

  // Fallback: Geocode city name alone
  if (city && city !== placeName) {
    try {
      const cityQuery = [city, stateOrCountry].filter(Boolean).join(', ').trim();
      const cityUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        cityQuery
      )}&format=json&limit=1`;

      const res = await fetch(cityUrl, {
        headers: {
          'User-Agent': 'GhoomoBharatTourismApp/1.0 (contact@ghoomo.in)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(2500),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          // Add small deterministic jitter around city center so multiple places don't stack on top of each other
          const baseLat = parseFloat(data[0].lat);
          const baseLng = parseFloat(data[0].lon);
          const hash = placeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const offsetLat = ((hash % 17) - 8) * 0.003;
          const offsetLng = (((hash * 7) % 17) - 8) * 0.003;

          const coords = {
            lat: baseLat + offsetLat,
            lng: baseLng + offsetLng,
          };
          GEOCODE_CACHE.set(cacheKey, coords);
          return coords;
        }
      }
    } catch {}
  }

  return null;
}
