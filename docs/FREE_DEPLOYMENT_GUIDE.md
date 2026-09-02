# 🚀 100% Free Zero-Cost Deployment Architecture & Setup Guide
## Project: Smart Travel & Tourism Platform (SIH26207)

This document provides a completely **free-tier production-grade deployment strategy** for your Hackathon project (no credit card or zero charges incurred).

---

## 1. Zero-Cost Tech & Cloud Architecture Stack

```mermaid
flowchart TD
    subgraph Frontend_Edge ["Frontend & Edge Hosting - 100% Free"]
        Vercel["Vercel / Netlify Hobby Plan"]
        NextApp["Next.js 14+ PWA / Web Client"]
    end

    subgraph Backend_Compute ["Backend & Serverless - 100% Free"]
        ServerlessAPI["Next.js API Routes / Serverless Functions"]
    end

    subgraph Managed_DB ["Database & Cache - 100% Free"]
        Supabase["Supabase / Neon - PostgreSQL + PostGIS"]
        Upstash["Upstash - Serverless Redis"]
        Cloudinary["Cloudinary / UploadThing - Photos & Media"]
    end

    subgraph Free_AI_APIs ["Free AI & External APIs"]
        Gemini["Google Gemini 1.5 Flash API - Free Tier"]
        Groq["Groq Cloud - LLaMA 3.3 70B - Ultra Fast & Free"]
        Mapbox["Mapbox GL / Leaflet OpenStreetMap"]
        OpenWeather["Open-Meteo / OpenWeatherMap - Free"]
    end

    NextApp --> Vercel
    Vercel --> ServerlessAPI
    ServerlessAPI <--> Supabase
    ServerlessAPI <--> Upstash
    ServerlessAPI <--> Gemini
    ServerlessAPI <--> Groq
    NextApp <--> Cloudinary
    NextApp <--> Mapbox
    ServerlessAPI <--> OpenWeather
```

---

## 2. Service-by-Service Free Tier Breakdown

| Component | Recommended Free Provider | Free Tier Limits | Why it's Best for Hackathons |
| :--- | :--- | :--- | :--- |
| **Frontend & API** | **Vercel** | Unlimited deployments, 100 GB bandwidth, Serverless functions | Native Next.js support, instant CI/CD on Git push, custom SSL domains. |
| **Relational & Geo DB** | **Supabase** or **Neon.tech** | 500 MB DB, 50k monthly active users, full PostgreSQL + PostGIS | Supports spatial queries (`ST_DWithin`) for nearby places/homestays out of the box. |
| **Caching & Pub/Sub** | **Upstash Redis** | 10,000 requests/day, 256 MB storage | Ideal for SOS real-time alert caching, rate limiting, and session state. |
| **AI / GenAI Engine** | **Google AI Studio (Gemini 1.5 Flash)** + **Groq** | 15 RPM (free), Groq: 30 RPM (LLaMA 3.3 70B, blazing fast < 500ms response) | Perfect for dynamic itinerary generation, multilingual translation, and chatbot. |
| **Media & Photo Storage** | **Cloudinary** / **UploadThing** | 25 GB free storage & bandwidth | Stores monument photos, homestay gallery images, and user avatars. |
| **Maps & Routing** | **Mapbox GL JS** / **OpenStreetMap (Leaflet)** | 50,000 map loads/month (Mapbox) or 100% Free Unlimited (OSM) | Smooth vector tiles, turn-by-turn routing, custom pins. |
| **Weather & Alerts** | **Open-Meteo** | 100% Free with No API key required | Real-time weather feeds, rain forecasts, temperature warnings. |

---

## 3. Step-by-Step Free Deployment Guide

### Step 1: Set Up Free Database on Supabase
1. Go to [supabase.com](https://supabase.com) and sign in with GitHub.
2. Click **New Project** -> Name it `sih-smart-tourism` -> Set a DB Password.
3. Enable PostGIS Extension:
   - Navigate to **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Copy the `DATABASE_URL` / `POSTGRES_PRISMA_URL` connection string from **Project Settings -> Database**.

---

### Step 2: Set Up Free AI API Keys
1. **Google Gemini Flash:** Go to [Google AI Studio](https://aistudio.google.com/) -> Create API Key (`GEMINI_API_KEY`).
2. **Groq Cloud (Optional for ultra-fast response):** Go to [console.groq.com](https://console.groq.com) -> Create API Key (`GROQ_API_KEY`).
3. **Open-Meteo (Weather):** No API key needed! Endpoint: `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current_weather=true`.

---

### Step 3: Configure Upstash Serverless Redis (For SOS Alerts & Cache)
1. Go to [upstash.com](https://upstash.com) -> Sign in with GitHub.
2. Click **Create Database** -> Select Free tier and primary region.
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

### Step 4: Environment Variables Template (`.env.production`)

```env
# Database (Supabase PostgreSQL + PostGIS)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"

# Free AI APIs
GEMINI_API_KEY="your_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"

# Maps & Media
NEXT_PUBLIC_MAPBOX_TOKEN="pk.your_mapbox_public_token"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"

# App URL
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate_random_32_char_secret"
```

---

### Step 5: Deploy to Vercel in 1 Click
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: SIH26207 Smart Tourism Platform ready for deploy"
   git branch -M main
   git remote add origin https://github.com/your-username/sih-smart-tourism.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) -> Click **Add New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, paste all values from Step 4.
5. Click **Deploy**. Vercel will build and publish your project to `https://sih-smart-tourism.vercel.app` with free SSL!

---

## 4. Zero-Cost Offline & PWA Configuration
To ensure zero failure during live hackathon judging when internet might be slow or unstable:
1. Enable `next-pwa` in `next.config.js` to automatically cache pages, offline maps, and generated itineraries via Service Workers.
2. Store itineraries and saved tickets locally inside client **IndexedDB** / `localStorage`.
3. Provide fallback offline mock data if external APIs rate-limit or fail.
