# 🚀 Implementation Plan: SIH26207 Smart Tourism Web Platform
## "Discover India, Every Step of the Way" (100% Free Web Stack + Grand Finale USPs)

We will build a high-performance, responsive, interactive Web Application (Next.js 14 / React 18 / Lucide Icons / Leaflet Maps / Pure CSS Glassmorphism Design System) packed with **winning USPs tailored 100% for the Web Portal** and **100% free-tier ready deployment** for SIH 2026.

---

## 🌟 Key Web Features & Unfair Advantages to Build

1. **AI Dynamic Reality-Aware Itinerary Generator:**
   - Multi-variable inputs (destination, days, budget, travel style, mobility).
   - Live Weather-Aware Rerouting simulator (e.g. click "Trigger 2 PM Monsoon Alert" to watch the schedule dynamically adapt from outdoor boating to an indoor museum in real time).
   - Delay Recalibration ("I am 45 min late at Red Fort" auto-adjusts remaining timeline).

2. **Tourist Scam-Shield & Fair-Price Auto-Negotiator:**
   - Fair transport fare calculator (auto-rickshaw, taxi based on official distance/rates).
   - Local dialect polite negotiation script with browser Web Speech audio playback support.

3. **Cultural Sensitivity & Taboo Advisor:**
   - Automatic flags for dress codes, head covering, footwear rules, photography zones, and holy prayer timings for spiritual/heritage sites.

4. **Speech-to-Speech / Text Regional Dialect Translator (Bhashini-Style):**
   - Instant bi-directional translation (English $\leftrightarrow$ Hindi, Tamil, Telugu, Bengali, Marathi, etc.) with browser Web Speech API audio synthesis.

5. **Real-Time Collaborative Group Planning & Split-Bill Ledger ("Figma for Travel"):**
   - Live collaborative web room where co-travelers join via link/QR and vote on attractions in real time.
   - Shared group expense ledger with auto-split and instant UPI payment deep-links.

6. **ONDC-Style Verified Local Artisan & Homestay Marketplace:**
   - Curated directory of verified local craftsmen, pottery makers, and authentic homestays with direct zero-commission contact & mock UPI QR pay.

---

## 🛠️ Technology Stack (100% Free Tier)

- **Frontend & App Framework:** Next.js (App Router), React 18, Lucide React (Icons), Canvas-Confetti, Leaflet / OpenStreetMap.
- **Styling:** Custom Vanilla CSS Design System with dark/light themes, sleek glassmorphism, fluid micro-animations, and modern typography.
- **AI Integrations:** Google Gemini 1.5 Flash API / Groq LLaMA 3.3 Free Tier + Smart deterministic fallback logic (guaranteed to work even if API keys are not provided).
- **Deployment:** Vercel Hobby Plan (100% Free with instant SSL and continuous Git deployment).

---

## 📁 Web Project Structure

```
SIH/
├── app/
│   ├── layout.js              # Global theme provider, root layout & fonts
│   ├── page.js                # Main hub: Hero, Itinerary Planner, Feature Showcase
│   ├── itinerary/
│   │   └── page.js            # Interactive Timeline, Weather Rerouter, Delay Rebalancer
│   ├── scam-shield/
│   │   └── page.js            # Fair-Price Lens, Auto-Rickshaw Meter, Audio Negotiation
│   ├── marketplace/
│   │   └── page.js            # ONDC-Style Verified Homestays & Artisan Network
│   ├── translator/
│   │   └── page.js            # Real-time Voice & Text Regional Dialect Translator
│   ├── group-collab/
│   │   └── page.js            # Collaborative Group Room & Auto-Split UPI Ledger
│   ├── api/
│   │   ├── itinerary/route.js # AI Multi-constraint trip planner
│   │   ├── chat/route.js      # Multilingual concierge endpoint
│   │   └── scam-shield/route.js # Fair-price calculator endpoint
│   └── globals.css            # Custom CSS Design System (Glassmorphism & tokens)
├── components/
│   ├── Navbar.js              # Web Navigation bar with quick access links
│   ├── Footer.js              # Project metadata, SIH badges & credits
│   ├── MapView.js             # Interactive Leaflet Map with POI pins and routes
│   └── CulturalModal.js       # Dress code and etiquette alert popups
├── package.json
└── next.config.js
```

---

## 🔍 Verification Plan

### Automated & Build Verification
1. `npm run build`: Validate clean production build with zero TypeScript/lint errors.
2. `npm run dev`: Start local dev server at `http://localhost:3000`.

### Manual End-to-End User Journeys
1. **Itinerary Generation:** Create a 3-day itinerary $\rightarrow$ Trigger the weather alert to observe instant dynamic schedule re-sequencing.
2. **Scam-Shield:** Calculate fair auto fare between New Delhi Railway Station and India Gate $\rightarrow$ Test speech audio playback.
3. **Regional Translator:** Speak/type English $\rightarrow$ Observe Tamil/Hindi translation with browser audio speech readout.
4. **Group Collab & Split-Bill:** Add attractions and expense items $\rightarrow$ Verify auto-split calculation.
