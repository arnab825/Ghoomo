# Ghoomo - Software Requirements Specification (SRS)

## 1. Functional Requirements

### FR-1: Social Media URL Processing
- The system shall parse valid URLs from Instagram (`instagram.com/reel/*`), TikTok (`tiktok.com/*`), YouTube (`youtube.com/*`, `youtu.be/*`), and generic travel blogs.
- The system shall extract place names, platform origin, author information, and media thumbnails.

### FR-2: Location Extraction & Geocoding
- The system shall match extracted place names against Indian geographic databases and assign accurate latitude and longitude coordinates.
- Each extracted place shall display a confidence score (High >80%, Medium 50-80%, Low <50%).
- The system shall allow users to manually correct location details or add unlisted places.

### FR-3: Interactive Map Visualization
- The system shall render an interactive map (Leaflet) centered on the trip's destination.
- Markers shall be color-coded by day and numbered in sequence.
- Selecting a place on the map shall highlight the corresponding card in the itinerary, and vice versa.

### FR-4: Automated Itinerary Generation
- Given a trip duration (N days) and a collection of places, the system shall group locations geographically to minimize transit distance between consecutive stops.
- The system shall distribute stops across Morning, Afternoon, and Evening slots.

### FR-5: Collaboration & Sharing
- The trip creator can invite collaborators via a generated link with either `editor` or `viewer` roles.
- `editor` can add places, import URLs, and modify day schedules.
- `viewer` has read-only access to view map, itinerary, and checklist.

### FR-6: Budget & Checklist
- The system shall compute total budgeted expenses versus remaining balance across categories (Stays, Transport, Food, Experiences).
- The system shall provide an interactive packing and travel preparation checklist.

---

## 2. Non-Functional Requirements
- **Performance**: Extraction and map rendering must execute within 2 seconds.
- **Responsiveness**: Fully responsive layout from mobile (375px) to ultra-wide desktop.
- **Reliability**: Seamless offline-ready state fallback so demo functions even if Supabase is unreachable.
