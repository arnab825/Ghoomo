# Ghoomo - System Architecture

## 1. Architectural Style
- **Platform**: Next.js (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, custom glassmorphism design system
- **State Management**: Zustand with LocalStorage persistence and TanStack Query for remote async data
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) and Supabase Auth
- **Mapping**: Leaflet with CartoDB dark/voyager tile layers, custom GeoJSON markers, and route polylines
- **Deployment**: Server-rendered pages with optimized client components for interactivity

---

## 2. Core Domains

The application is strictly partitioned into the following 8 functional domains:

1. **`auth`**: User registration, authentication, session tokens, and instant evaluator demo personas.
2. **`social-import`**: Social media URL intake, platform detection (Instagram, TikTok, YouTube, blogs), metadata extraction, and coordinate resolution.
3. **`places`**: Repository of trip locations (detected vs manual), coordinates, confidence scores, notes, and category classification.
4. **`map`**: Dynamic interactive map, custom pin styling by day, cluster management, route polylines, and bi-directional hover/click synchronization.
5. **`itinerary`**: Proximity-based geographic clustering, day scheduling, time-slot management (Morning, Afternoon, Evening), and drag-and-drop reorganization.
6. **`collaboration`**: Shareable invite links, role-based access control (Editor vs Viewer), and collaborator presence.
7. **`budget-checklist`**: Practical travel financial tracking (stays, transit, food, activities) and packing/prep checklists.
8. **`trip-dashboard`**: Centralized, map-first workspace presenting the trip overview and navigation between domains.

---

## 3. Data Flow Architecture

```
[Social URL (IG / TikTok / YT)] 
               │
               ▼
[Social Import Engine / API (/api/social-import)]
               │
               ├──> [Extract Place Metadata & Source Credits]
               └──> [Geocode Coordinates & Match India Landmarks]
                               │
                               ▼
              [Zustand State Store + Supabase DB]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Leaflet Interactive Map]           [Proximity Clustering Algorithm]
- Render markers by day              - Group nearby coordinates
- Polyline route preview             - Assign to Day 1..N schedules
- Synchronize click/hover            - Allocate Morning / Afternoon / Evening
```
