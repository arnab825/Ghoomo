# Ghoomo - Development Task List

## P0: Hackathon MVP Core Flow (Completed)
- [x] Project architecture & prompt queue alignment
- [x] Update project documentation in `/docs`
- [x] Implement database schema (`supabase/schema.sql`)
- [x] Ingest India canonical places reference table (58 landmarks across 4 regions)
- [x] Define TypeScript types (`src/lib/types/ghoomo.ts`) and Zod schemas (`src/lib/schemas/trip.ts`)
- [x] Build global Ghoomo Zustand store (`src/stores/useGhoomoStore.ts`)
- [x] Build social URL extraction engine with seed reel parsers (`src/features/social-import/extractors.ts`)
- [x] Implement 3-Tier AI Fallback Engine (Gemini 1.5 Flash → Groq Llama 3.1 70B → Haversine Clustering)
- [x] Enforce exact timeouts (Tier 1: 5s, Tier 2: 3s, Tier 3: 0ms) & retries
- [x] Post-processing validation (Max 6-8 places, <2h transit, route review flagging)
- [x] Progressive loading user feedback (0-2s, 2-4s, 4-7s, 7-10s)
- [x] Implement interactive Leaflet map component with CartoDB Light tiles (`src/components/map/InteractiveMap.tsx`)
- [x] Build Proximity Clustering Engine for automatic day-wise itinerary scheduling (`src/features/itinerary/clustering.ts`)
- [x] Build high-converting Landing Page with live Reel URL tester (`src/app/page.tsx`)
- [x] Build clean Auth page with 1-click evaluator persona switcher (`src/app/auth/page.tsx`)
- [x] Build Trip Creation Wizard (`src/app/trips/new/page.tsx`)
- [x] Build Flagship Map-First Trip Workspace (`src/app/trips/[id]/page.tsx`)
- [x] Build Trip Library Dashboard (`src/app/trips/page.tsx`)
- [x] Build Collaboration modal & invite link generator (`src/components/collaboration/CollaborationModal.tsx`)
- [x] Build Budget tracker & Travel checklist (`src/components/budget-checklist/`)
- [x] Retire and delete legacy scam/meter/marketplace/translator code

## P1: Enhancements
- [ ] Drag-and-drop itinerary reordering
- [ ] Category-based map filtering (Food, Sightseeing, Nature)
- [ ] Public read-only trip viewer (`src/app/trips/[id]/share/page.tsx`)

## P2: Post-Hackathon
- [ ] Live weather rerouting suggestions
- [ ] Real-time Supabase presence channels for collaborative cursor sync
- [ ] Offline PWA caching for remote India travel
