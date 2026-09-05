# Beginner-Friendly Implementation Plan: Smart Tourism & Hospitality Platform (SIH26207)
**Tagline:** *Discover India, Every Step of the Way*

---

## 🎯 Architecture Philosophy: Simple, Clean & Robust
We adopt the official **Next.js `src/` directory convention**. Everything application-related lives inside `src/`. There are no confusing deeply-nested folders; each folder has a single, intuitive responsibility so any beginner can understand where code belongs.

---

## 📁 Beginner-Friendly Project Structure (`src/`)

```
SIH/
├── public/                       # Static public assets (images, logos, icons)
├── supabase/
│   └── schema.sql                # 1 clean SQL script with all tables & demo seed data
├── src/
│   ├── app/                      # Next.js App Router (Every folder here is a web page or API)
│   │   ├── layout.tsx            # Global layout: Navbar, TanStack Query Provider, Footer
│   │   ├── page.tsx              # Home Page (Hero, Feature Highlights, Quick Itinerary Starter)
│   │   ├── globals.css           # Pure Vanilla CSS design system (Glassmorphism, colors, cards)
│   │   ├── itinerary/
│   │   │   └── page.tsx          # Smart AI Itinerary Planner & Dynamic Rerouting simulator
│   │   ├── scam-shield/
│   │   │   └── page.tsx          # Fair-Price Calculator, Scam Alerts & Audio Bargaining phrases
│   │   ├── marketplace/
│   │   │   └── page.tsx          # Verified Homestays, Artisans & Guides (Kaggle-powered)
│   │   ├── etiquette/
│   │   │   └── page.tsx          # Cultural Do's & Don'ts, Sacred Dress Codes & Footwear Rules
│   │   ├── translator/
│   │   │   └── page.tsx          # Bhashini-style Regional Voice & Text Translator
│   │   ├── group-collab/
│   │   │   └── page.tsx          # Collaborative Group Room, Attraction Voting & Split Ledger
│   │   ├── auth/
│   │   │   └── page.tsx          # Simple Login / Signup & 1-click Guest Demo Mode
│   │   └── api/                  # Backend API routes (Validated with Zod)
│   │       ├── itinerary/route.ts# POST: Generate AI Itinerary (Gemini / Grok / Fallback)
│   │       ├── reroute/route.ts  # POST: Dynamic Rerouting (Weather & Delays)
│   │       ├── scam-shield/route.ts# GET/POST: Fair fare rates & scam warnings
│   │       └── translate/route.ts# POST: Regional Indian language translator
│   │
│   ├── components/               # Simple, reusable React components
│   │   ├── Navbar.tsx            # Navigation header with active links & language picker
│   │   ├── Footer.tsx            # Footer with SIH badge and project credits
│   │   ├── Providers.tsx         # TanStack Query Client wrapper
│   │   ├── MapView.tsx           # Leaflet/OpenStreetMap interactive view
│   │   ├── ItineraryCard.tsx     # Clean day-by-day activity card with time badge & tips
│   │   └── ScamBadge.tsx         # Fair-price status indicator badge
│   │
│   ├── data/                     # Clean Kaggle JSON datasets (Offline-ready & fast)
│   │   ├── destinations.json     # Kaggle dataset: 100+ Indian heritage sites, timings, fees
│   │   ├── homestays.json        # Kaggle/Curated authentic homestays & local artisans
│   │   ├── fair-rates.json       # Benchmark rates (Auto, Taxi, Guides, Souvenirs) across Indian cities
│   │   └── cultural-rules.json   # State-by-state dress codes, shoes, photography restrictions
│   │
│   ├── schemas/                  # Zod validation schemas (Prevents invalid data & bugs)
│   │   ├── itinerary.ts          # Validates user trip input (days, budget, interests)
│   │   └── scam.ts               # Validates fair-price queries
│   │
│   ├── lib/                      # Core backend & service helpers (Simple 1-file services)
│   │   ├── ai.ts                 # Unified AI helper (Gemini, Grok, HF + smart offline fallback)
│   │   └── supabase.ts           # Supabase client + fallback local store
│   │
│   └── types/                    # Shared TypeScript interfaces
│       └── index.ts              # Trip, Attraction, Listing, and ScamAlert types
│
├── .env.example                  # Easy reference for API keys (optional)
├── package.json                  # Dependencies & start scripts
├── tsconfig.json                 # Path alias "@/*" pointing to "./src/*"
└── next.config.js                # Next.js config
```

---

## 🌟 Why this Structure is Beginner-Friendly & Robust

1. **One Place for Pages (`src/app`)**:
   - Want to edit the Itinerary page? Open `src/app/itinerary/page.tsx`.
   - Want to edit the Scam Shield page? Open `src/app/scam-shield/page.tsx`.
   - Each route is an isolated folder.

2. **One Place for Data (`src/data`)**:
   - Pure JSON files sourced from Kaggle.
   - Zero complex database configuration needed for a local demo: the JSON files work out-of-the-box, while Supabase provides real persistence.

3. **One Unified AI Helper (`src/lib/ai.ts`)**:
   - Instead of 5 complex AI files, `src/lib/ai.ts` orchestrates **Gemini**, **Grok**, and **Hugging Face** in one clean function.
   - If no API key is set, it falls back smoothly to high-quality Kaggle data. It **never crashes** during judging or presentations.

4. **Clean Component Boundary (`src/components`)**:
   - Only shared UI pieces live here (`Navbar`, `Footer`, `MapView`, `Providers`).
   - Keeps components small (under 100–150 lines), easy to read, and easy to modify.

5. **Type Safety & Validation (`src/schemas` & `src/types`)**:
   - `Zod` schemas validate incoming form data.
   - TypeScript interfaces ensure clean autocompletion across the entire app.

---

## 🚀 Step-by-Step Implementation Flow

- **Step 1**: Install core dependencies (`@tanstack/react-query`, `zod`, `@supabase/supabase-js`, `lucide-react`, `leaflet`).
- **Step 2**: Create datasets in `src/data/` (Kaggle Indian monuments, homestays, rates, etiquette rules).
- **Step 3**: Create types in `src/types/index.ts` and Zod schemas in `src/schemas/`.
- **Step 4**: Create `src/lib/supabase.ts` and `src/lib/ai.ts` (orchestrating Gemini, Grok, HF with Kaggle fallback).
- **Step 5**: Create API routes in `src/app/api/` for itinerary generation, dynamic rerouting, scam pricing, and translation.
- **Step 6**: Build the custom Vanilla CSS design system in `src/app/globals.css`.
- **Step 7**: Implement shared components (`Navbar`, `Footer`, `Providers`, `MapView`, `ItineraryCard`).
- **Step 8**: Implement feature pages:
  - `src/app/page.tsx` (Home / Discovery)
  - `src/app/itinerary/page.tsx` (AI Planner & Dynamic Weather Reroute Simulator)
  - `src/app/scam-shield/page.tsx` (Fair-Price Meter & Audio Bargaining)
  - `src/app/marketplace/page.tsx` (Verified Homestays & Artisans)
  - `src/app/etiquette/page.tsx` (Cultural Rules & Sacred Site Radar)
  - `src/app/translator/page.tsx` (Regional Indian Dialect Audio/Text Translator)
  - `src/app/group-collab/page.tsx` (Live Group Room & Split-Expense Ledger)
  - `src/app/auth/page.tsx` (Supabase Auth & Guest Demo mode)
- **Step 9**: Verification with `npm run build` and browser testing.
