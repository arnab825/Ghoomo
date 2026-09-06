# Ghoomo - Environment Configuration & Security Guide

This document defines the complete environment variable schema, scopes, and security practices for Ghoomo.

---

## Architecture & Security Principles

1. **Client vs Server Isolation**:
   - Variables prefixed with `NEXT_PUBLIC_` are inlined by Next.js into client-side JavaScript bundles at build time. Only values that are safe for public exposure (such as public URLs or anon keys guarded by Row-Level Security) should have this prefix.
   - Variables without `NEXT_PUBLIC_` are **strictly server-only**. They can only be accessed inside Server Actions (`'use server'`), API Routes (`src/app/api/`), or server-only utility functions.
2. **Never Commit Secrets**:
   - `.env`, `.env.local`, `.env.*.local`, and runtime JSON storage (`src/data/trips.json`) are ignored in `.gitignore`.
   - Never commit API keys, service role credentials, or payment secrets to git.

---

## Environment Variables Matrix

| Variable | Scope | Required? | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | Optional | Supabase Project URL (e.g. `https://xyz.supabase.co`). Defaults to local offline mock. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | Optional | Supabase Anonymous Key (guarded by Row-Level Security). |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | Recommended | Base canonical URL (e.g. `http://localhost:3000` or production domain). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public (Client + Server) | Optional | Razorpay Public Key ID for client checkout modal. |
| `RAZORPAY_KEY_SECRET` | **Server-Only (Private)** | Optional | Razorpay Secret Key for HMAC SHA256 payment signature verification and order creation. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only (Private)** | Optional | Full administrative key for backend database migrations/seed scripts (`scripts/seedPlacesReference.ts`). |
| `GEMINI_API_KEY` | **Server-Only (Private)** | Optional | Google Gemini API key for Tier 1 AI generation (itinerary planning, smart budgets). |
| `GROQ_API_KEY` / `GROK_API_KEY` | **Server-Only (Private)** | Optional | Groq Cloud API key for Tier 2 ultra-fast open-weight LLM inference (Llama, Mixtral, Qwen). |
| `HUGGINGFACE_API_KEY` | **Server-Only (Private)** | Optional | Hugging Face Inference API token for Tier 3 models and Whisper speech-to-text. |

---

## Local Development & Fallbacks

- **Zero-Config Demo Mode**: When external API keys are omitted, Ghoomo gracefully degrades to deterministic offline fallback generation, in-memory reference place matching, and simulated sandbox payments (`order_test_*`).
- **Setup Instructions**:
  1. Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
  2. Populate your desired keys.
  3. Start the development server:
     ```bash
     npm run dev
     ```
