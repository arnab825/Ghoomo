# Ghoomo - Product Requirements Document (PRD)

## Product Name
**Ghoomo**

### Tagline
*Turn Social Travel Inspiration into Reality-Ready Indian Itineraries*

---

## 1. Executive Summary

Ghoomo is a web platform that transforms viral social media travel inspiration (TikTok, Instagram Reels, YouTube Shorts, travel blogs, and Pinterest) into practical, collaborative, map-based itineraries across India.

Instead of losing saved reels in bookmark folders or struggling with chaotic WhatsApp group chats, travelers paste social URLs into Ghoomo. The platform automatically extracts location candidates with source traceability, pins them to an interactive map, clusters them into logical day-wise routes, and lets friends collaborate on budget and packing checklists in real time.

---

## 2. Problem Statement

Modern travelers discover their best travel ideas on social media:
1. **Scattered Links**: Hundreds of saved Instagram Reels, TikToks, and YouTube Shorts with no unified way to view or organize them.
2. **Geographic Ignorance**: Not knowing where a viral café, secret waterfall, or hidden sunrise spot is relative to other attractions, leading to zigzagging and wasted travel time.
3. **Planning Inertia**: The friction of converting a 30-second aesthetic reel into an actionable day-by-day itinerary with timings, routes, and costs.
4. **Group Planning Friction**: Disconnected WhatsApp chats and messy Google Sheets where travel companions argue over itineraries without a visual map.

---

## 3. Product Vision & Positioning

**Vision**: The fastest, most visual bridge from internet travel inspiration to boots-on-the-ground travel execution in India.

**Positioning**: Ghoomo is neither a generic corporate SaaS planner nor an outdated travel agency portal. It is a **map-first, social-native travel studio** built specifically for domestic and international travelers exploring India.

---

## 4. Target Personas

### Primary Users
- **The Reel Explorer (Solo/Couple)**: Discovers aesthetic spots on Instagram/TikTok; wants an instant map and route without manually searching every spot.
- **The Group Trip Planner (Lead Organizer)**: Coordinates a 4-7 day trip with friends/family; needs visual consensus, a shared link, and a collaborative itinerary.
- **The Weekend Backpacker**: Seeks quick 2-3 day escapes around Himachal, Uttarakhand, Rajasthan, Goa, or Karnataka.

---

## 5. MVP Feature Set (Hackathon Scope)

### P0 (Must-Have for Demo)
- **Authentication**: Simple, clean Supabase auth with 1-click evaluator demo personas (Trip Lead, Collaborator).
- **Trip Creation**: Trip name, Indian destination region, dates, duration, budget target, and travel style.
- **Social URL Import**: Ingest TikTok, Instagram Reels, YouTube Shorts, or Blog URLs.
- **Location Extraction & Traceability**: Extract places with platform badges, thumbnails, original creator credits, and confidence scores (High, Medium, Low).
- **Manual Place Addition**: Fallback to search or manually add any Indian landmark with custom notes.
- **Interactive Map**: Leaflet-powered dark mode map with day-colored markers, route polyline connections, and click-to-highlight sync.
- **Day-Wise Itinerary Generator**: Proximity clustering algorithm that groups nearby places into logical days to minimize travel time.
- **Editable Itinerary Builder**: Move places between days, change time slots (Morning, Afternoon, Evening), and adjust timings.
- **Collaboration**: Shareable trip links with permission controls (Editor vs Viewer) and live collaborator badges.
- **Budget & Checklist**: Expense breakdown by category (Stays, Transport, Food, Experiences) and trip prep checklist.
- **Trip Dashboard & Library**: Central overview of all active and past trips.

### P1 (Later in Hackathon / Fast Follows)
- Itinerary pacing customization (Relaxed vs Balanced vs Fast-Paced).
- Real-time collaborator activity notifications.
- Filter map places by category (Food, Nature, Heritage, Adventure).

### P2 (Post-Hackathon Roadmap)
- Weather-aware indoor/outdoor activity recommendations.
- Local verified transport and homestay partner integration.
- Offline PWA support for low-connectivity Indian regions.

---

## 6. Core User Flow

```
[1. User Signs In / Picks Demo Persona]
           ↓
[2. Create Trip (Destination, Days, Style)]
           ↓
[3. Paste Instagram / TikTok / YouTube / Blog URL]
           ↓
[4. Ghoomo Extracts Places with Source Traceability & Confidence]
           ↓
[5. Interactive Map Displays Locations & Route Visuals]
           ↓
[6. System Clusters Places into Day-Wise Itinerary]
           ↓
[7. User Invites Friends via Share Link (Editor / Viewer)]
           ↓
[8. Team Customizes Budget & Pre-Trip Checklist]
           ↓
[9. Ready-to-Travel Dashboard & Map]
```

---

## 7. Success Criteria

1. A user can paste a social URL and see verified map pins in under 3 seconds.
2. Auto-generated itinerary groups places geographically without backtracking.
3. Full collaboration link allows secondary users to join and edit.
4. Clean, responsive, dark-mode UI with vibrant Indian saffron and emerald accents.
