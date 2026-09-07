# Ghoomo → Adaptive Learning Navigation Engine: Full Architectural Transformation

## Repository Audit Summary

### What Already Works (Retain & Strengthen)
| Layer | Status | Files |
|---|---|---|
| **Supabase Auth** | ✅ Real auth (signIn, signUp, signOut, session, getUser) | [useAuthStore.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/stores/useAuthStore.ts), [middleware.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/middleware.ts) |
| **Server-side identity** | ✅ Server actions use `createServerSupabaseClient()` + `getUser()` | [learningActions.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/app/actions/learningActions.ts) |
| **Middleware protection** | ✅ `/app/*` requires authenticated user | [middleware.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/middleware.ts) |
| **Graph validator** | ✅ DFS 3-color cycle detection + Kahn's topo sort + repair | [graphValidator.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/graphValidator.ts) |
| **Mastery policy** | ✅ Deterministic state transitions, AI cannot mutate state | [masteryPolicy.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/masteryPolicy.ts) |
| **Adaptive router** | ✅ Priority-based deterministic routing with gap analysis | [adaptiveRouter.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/adaptiveRouter.ts) |
| **Gap detector** | ✅ Blocked/missing/weak/ready concept classification | [knowledgeGapDetector.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/knowledgeGapDetector.ts) |
| **Priority queue** | ✅ Min-heap for efficient concept selection | [priorityQueue.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/priorityQueue.ts) |
| **AI client** | ✅ Gemini + Groq fallback, Zod validation, caching | [geminiClient.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/ai/geminiClient.ts) |
| **Database schema** | ✅ Education tables with FK, constraints, indexes, RLS enabled | [03_adaptive_education_schema.sql](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/supabase/migrations/03_adaptive_education_schema.sql) |
| **Epistemic states** | ✅ UNKNOWN→EXPOSED→PROVISIONALLY_READY→DEVELOPING→NEEDS_REVIEW→MASTERED | [engine.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/types/engine.ts) |
| **Engine tests** | ✅ 12 test files covering router, mastery, graph, RLS, performance | [__tests__/](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/__tests__) |
| **Dashboard** | ✅ Real Supabase queries, no mock data in production UI | [page.tsx](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/app/app/page.tsx) |

### Critical Issues to Fix

| Issue | Severity | Details |
|---|---|---|
| **RLS policies too permissive** | 🔴 HIGH | `learner_concept_state` uses `auth.uid() = user_id or true` — the `or true` nullifies user isolation |
| **Legacy travel schema** | 🟡 MED | `schema.sql` still has trips/places/itinerary tables |
| **AI generates 4-6 shallow concepts** | 🔴 HIGH | Must produce 15-35+ concept knowledge terrains |
| **Knowledge graph is a card list** | 🔴 HIGH | No interactive visual graph with edges/zoom/pan |
| **Activity page is MCQ-only** | 🔴 HIGH | No code, trace, evidence, rich content |
| **No persistent AI cache** | 🟡 MED | Only in-memory Maps |
| **No Supabase Realtime subscriptions** | 🔴 HIGH | Tables have Realtime enabled but NO client subscriptions exist |
| **No HuggingFace fallback** | 🟡 MED | Only 2 of 3 required fallback tiers |
| **No error boundary coverage** | 🟡 MED | Missing per-section graceful degradation |
| **No Vercel deployment config** | 🟡 MED | No `vercel.json`, no edge runtime, no ISR |

---

## Resolved Decisions

| Question | Decision | Rationale |
|---|---|---|
| Graph library | **Pure SVG + CSS transforms** | Zero dependency, smallest bundle, full control, Vercel-friendly |
| Code execution | **AI evaluation for MVP** | No WASM runtime needed, stays within Vercel serverless limits |
| Migrations | **Generate SQL files** | User applies to their Supabase instance |
| Deployment | **Vercel free tier** | Edge functions, serverless, auto-deploy from git |
| Realtime | **Full Supabase Realtime on every table** | Live UX across all views |

---

## NON-NEGOTIABLE: DEPLOYMENT ON VERCEL FREE TIER

### Constraints
| Limit | Value | Strategy |
|---|---|---|
| Serverless function timeout | 10s (Hobby) | AI calls must complete or timeout + fallback within 10s |
| Serverless function size | 250 MB uncompressed | Tree-shake aggressively, no heavy deps |
| Edge function size | 1 MB | Middleware stays lightweight |
| Bandwidth | 100 GB/month | Efficient caching, no unnecessary API calls |
| Build time | 45 min | Incremental builds, no heavy generation at build |
| ISR revalidation | Supported | Use for static pages (landing, about, pricing) |
| Serverless regions | Auto | Ensure Supabase region matches |

### Vercel Configuration

#### [NEW] `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "functions": {
    "src/app/actions/*.ts": { "maxDuration": 10 },
    "src/app/api/**/*.ts": { "maxDuration": 10 }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

#### [MODIFY] `next.config.js`
- Enable `output: 'standalone'` for optimal Vercel deployment
- Configure `serverExternalPackages` if needed
- Set `images.unoptimized: false` for Vercel Image Optimization
- Add security headers

---

## NON-NEGOTIABLE: FULL SUPABASE REALTIME

### Architecture

Every mutable table gets a Realtime subscription. When ANY user's state changes (another browser, teacher action, AI evaluation completing), the UI updates instantly without polling.

### Realtime Tables & Events

| Table | Events | UI Impact |
|---|---|---|
| `learner_concept_state` | INSERT, UPDATE | Knowledge Terrain nodes change color in real-time; dashboard stats update live |
| `attempts` | INSERT | Recent practice list updates live; accuracy recalculates |
| `misconceptions` | INSERT, UPDATE | Alert banner appears; knowledge node pulses; route recalculates visibly |
| `evidence` | INSERT, UPDATE | Evidence count updates; mastery check triggers |
| `route_events` | INSERT | Decision trail updates; route diff animation plays |
| `learning_activities` | INSERT | New activity appears in journey; progressive content loads |
| `concepts` | INSERT | Knowledge terrain adds new nodes (during goal creation) |
| `questions` | INSERT | New questions available for practice |
| `resources` | INSERT | Resource panel updates with new materials |
| `review_schedule` | INSERT, UPDATE | Review reminders appear; spaced retrieval triggers |
| `learning_goals` | UPDATE | Goal status changes reflected on dashboard |
| `learning_journeys` | UPDATE | Journey progress updates |
| `profiles` | UPDATE | Profile changes reflected in navbar/sidebar |

### Implementation

#### [NEW] `src/hooks/useRealtimeSubscription.ts`
Generic typed Realtime hook:
```typescript
function useRealtimeTable<T>(
  table: string,
  filter?: { column: string; value: string },
  onInsert?: (payload: T) => void,
  onUpdate?: (payload: T) => void,
  onDelete?: (payload: T) => void,
): void
```
- Manages subscription lifecycle with cleanup
- Reconnection with exponential backoff on disconnect
- Connection status indicator (connected/reconnecting/disconnected)
- Deduplication of events
- Batched state updates to prevent render storms

#### [NEW] `src/hooks/useRealtimeLearnerState.ts`
Specialized hook for learner state changes:
- Subscribes to `learner_concept_state` filtered by `user_id`
- On UPDATE: recalculates gap analysis and router in-memory
- On state → MASTERED: triggers confetti-free unlock animation on Knowledge Terrain
- On state → NEEDS_REVIEW: pulses the affected node, shows route change

#### [NEW] `src/hooks/useRealtimeMisconceptions.ts`
- Subscribes to `misconceptions` filtered by `user_id`
- On INSERT (new misconception detected): shows toast + route recalculation animation
- On UPDATE (misconception resolved): clears warning, re-enables progression

#### [NEW] `src/hooks/useRealtimeRouteEvents.ts`
- Subscribes to `route_events` filtered by `user_id` + `journey_id`
- On INSERT: appends to decision trail, triggers route diff visual

#### [NEW] `src/components/shared/RealtimeStatus.tsx`
Tiny indicator in bottom-right:
- 🟢 Connected (subtle, nearly invisible)
- 🟡 Reconnecting... (pulse animation)
- 🔴 Disconnected — data may be stale (visible, non-blocking)

### Realtime Edge Cases & Error Handling

| Edge Case | Handling |
|---|---|
| WebSocket disconnects | Auto-reconnect with backoff: 1s → 2s → 4s → 8s → 16s max |
| Missed events during disconnect | On reconnect: fetch latest state from DB, diff with local, apply updates |
| Rapid-fire events (user submits 5 answers fast) | Debounce UI updates to 200ms batches |
| Stale token | Re-auth via `supabase.auth.getSession()` before resubscribe |
| Multiple tabs | Each tab subscribes independently; state consistent via DB source of truth |
| Server-side event (teacher verifies evidence) | Learner's UI updates in real-time via Realtime |
| Supabase Realtime quota (free tier: 200 concurrent connections) | One subscription per table per user, not per component |

---

## NON-NEGOTIABLE: PREMIUM UI/UX DESIGN SYSTEM

### Color System

```css
/* === GHOOMO ADAPTIVE LEARNING DESIGN TOKENS === */

/* Primary: Deep Indigo → Intelligence, Precision */
--ghoomo-primary-50: oklch(0.97 0.01 260);
--ghoomo-primary-100: oklch(0.93 0.03 260);
--ghoomo-primary-200: oklch(0.86 0.06 260);
--ghoomo-primary-300: oklch(0.75 0.10 260);
--ghoomo-primary-400: oklch(0.64 0.16 260);
--ghoomo-primary-500: oklch(0.55 0.20 260);   /* Main brand */
--ghoomo-primary-600: oklch(0.47 0.22 260);   /* Hover */
--ghoomo-primary-700: oklch(0.40 0.20 260);
--ghoomo-primary-800: oklch(0.33 0.16 260);
--ghoomo-primary-900: oklch(0.27 0.12 260);

/* Knowledge State Colors (CRITICAL — these ARE the product) */
--state-locked: oklch(0.55 0.01 260);         /* Muted gray — cannot access */
--state-available: oklch(0.65 0.15 250);       /* Cool blue — ready to start */
--state-current: oklch(0.60 0.22 275);         /* Vivid indigo — active now */
--state-developing: oklch(0.72 0.16 85);       /* Warm amber — in progress */
--state-needs-review: oklch(0.62 0.22 25);     /* Alert coral — misconception */
--state-mastered: oklch(0.72 0.18 155);        /* Rich emerald — proven */
--state-skipped: oklch(0.78 0.10 155);         /* Light green — verified skip */
--state-exposed: oklch(0.70 0.08 260);         /* Soft periwinkle — seen but not tested */

/* Surfaces */
--surface-0: oklch(1.00 0.00 0);              /* White background */
--surface-1: oklch(0.98 0.002 260);            /* Elevated card */
--surface-2: oklch(0.96 0.004 260);            /* Nested card */
--surface-3: oklch(0.93 0.006 260);            /* Deep nested */

/* Dark Mode Surfaces */
--surface-0-dark: oklch(0.14 0.01 260);        /* Deep navy */
--surface-1-dark: oklch(0.18 0.012 260);       /* Card */
--surface-2-dark: oklch(0.22 0.014 260);       /* Nested */
--surface-3-dark: oklch(0.26 0.016 260);       /* Deep nested */

/* Semantic */
--success: oklch(0.72 0.18 155);
--warning: oklch(0.78 0.16 85);
--error: oklch(0.62 0.22 25);
--info: oklch(0.65 0.15 250);

/* Edge/Connection Colors */
--edge-default: oklch(0.80 0.02 260);
--edge-active: oklch(0.60 0.20 260);
--edge-locked: oklch(0.85 0.01 260);
--edge-route: oklch(0.55 0.22 260);            /* Glowing route path */
```

### Typography System

```css
/* Google Fonts: Inter (body) + Outfit (headings) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

--font-heading: 'Outfit', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Type Scale (modular 1.25 ratio) */
--text-3xs: 0.625rem;    /* 10px — metadata, timestamps */
--text-2xs: 0.6875rem;   /* 11px — badges, captions */
--text-xs: 0.75rem;      /* 12px — secondary text */
--text-sm: 0.875rem;     /* 14px — body */
--text-base: 1rem;       /* 16px — primary body */
--text-lg: 1.125rem;     /* 18px — section title */
--text-xl: 1.25rem;      /* 20px — card heading */
--text-2xl: 1.5rem;      /* 24px — page heading */
--text-3xl: 1.875rem;    /* 30px — hero heading */
--text-4xl: 2.25rem;     /* 36px — display */
--text-5xl: 3rem;        /* 48px — hero display */

/* Line Heights */
--leading-tight: 1.2;
--leading-snug: 1.35;
--leading-normal: 1.5;
--leading-relaxed: 1.65;

/* Letter Spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0em;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-extrabold: 800;
--weight-black: 900;
```

### Spacing & Layout System

```css
/* 4px base unit */
--space-0: 0;
--space-0.5: 0.125rem;   /* 2px */
--space-1: 0.25rem;      /* 4px */
--space-1.5: 0.375rem;   /* 6px */
--space-2: 0.5rem;       /* 8px */
--space-2.5: 0.625rem;   /* 10px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-5: 1.25rem;      /* 20px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-10: 2.5rem;      /* 40px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-20: 5rem;        /* 80px */
--space-24: 6rem;        /* 96px */

/* Border Radius */
--radius-sm: 0.375rem;   /* 6px — inputs */
--radius-md: 0.5rem;     /* 8px — small cards */
--radius-lg: 0.75rem;    /* 12px — cards */
--radius-xl: 1rem;       /* 16px — large cards */
--radius-2xl: 1.25rem;   /* 20px — panels */
--radius-3xl: 1.5rem;    /* 24px — hero sections */
--radius-full: 9999px;   /* Pills/avatars */

/* Shadows (layered for depth) */
--shadow-xs: 0 1px 2px oklch(0 0 0 / 0.04);
--shadow-sm: 0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.04);
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 0.06), 0 4px 6px -4px oklch(0 0 0 / 0.04);
--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 0.08), 0 8px 10px -6px oklch(0 0 0 / 0.04);
--shadow-glow: 0 0 20px oklch(0.55 0.20 260 / 0.15);  /* Route glow */
--shadow-state-mastered: 0 0 12px oklch(0.72 0.18 155 / 0.25);
--shadow-state-review: 0 0 12px oklch(0.62 0.22 25 / 0.25);

/* Motion */
--duration-instant: 50ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Symmetry & Layout Rules

| Rule | Specification |
|---|---|
| **Page max-width** | `max-w-7xl` (1280px) centered with `mx-auto` |
| **Grid system** | 12-column grid, `gap-4` minimum (16px), `gap-6` standard (24px) |
| **Card padding** | Always `p-5` (20px) for standard cards, `p-6` (24px) for featured |
| **Section spacing** | Always `space-y-8` (32px) between major sections |
| **Component spacing** | Always `space-y-4` (16px) within cards |
| **Text + icon alignment** | Always `flex items-center gap-2` for icon-text pairs |
| **Badge sizing** | Consistent `text-2xs font-bold px-2.5 py-0.5 rounded-full` |
| **Button sizing** | sm: `h-8 px-3`, md: `h-9 px-4`, lg: `h-10 px-5` |
| **Border color** | Light: `border-slate-200`, Dark: `border-slate-800` — NEVER mix |
| **Focus rings** | `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghoomo-primary-500` |
| **Hover transitions** | Always `transition-colors duration-fast` minimum |
| **Border radius** | Cards: `rounded-2xl`, Buttons: `rounded-xl`, Inputs: `rounded-xl`, Badges: `rounded-full` |
| **Icon sizes** | Inline: 14-16px, Card header: 17-18px, Hero: 24-28px, Empty state: 32-40px |
| **Minimum touch target** | 44×44px for mobile interactive elements |
| **Text contrast** | WCAG AA minimum: 4.5:1 body text, 3:1 large text |

### Responsive Breakpoints

| Breakpoint | Width | Grid | Layout |
|---|---|---|---|
| Mobile | < 640px | 1 col | Stacked, bottom nav, full-width cards |
| Tablet | 640-1024px | 2 col | Side-by-side cards, collapsible sidebar |
| Desktop | 1024-1280px | 3 col | Full sidebar, split panels |
| Wide | > 1280px | 4 col | Knowledge terrain fullscreen, inspector docked |

### Micro-Animations (State-Communicating Only)

| Trigger | Animation | Duration |
|---|---|---|
| Concept → MASTERED | Node scales up 1.1x, border glows emerald, connected edges animate directionally | 600ms ease-spring |
| Concept → NEEDS_REVIEW | Node pulses with coral glow 2x, then settles | 800ms |
| Route recalculated | Old route fades (200ms), new route draws in sequentially (400ms) | 600ms total |
| New misconception detected | Toast slides in from right, affected node pulses | 400ms |
| Prerequisite unlocked | Lock icon morphs to checkmark, node color transitions | 300ms |
| Evidence submitted | Progress ring fills, checkmark draws in | 500ms |
| Next Best Action updates | Card content crossfades | 250ms |
| Knowledge terrain zoom | CSS transform with smooth interpolation | 200ms |
| Panel open/close | Slide + fade with spring easing | 300ms |
| Loading skeleton | Pulse animation `animate-pulse` on placeholder shapes | Infinite |
| Error recovery | Shake animation (3 cycles) + error color flash | 400ms |

---

## NON-NEGOTIABLE: COMPREHENSIVE ERROR HANDLING

### Error Taxonomy

Every error is classified and handled with a specific user-facing recovery:

| Error Class | Examples | UI Response | Recovery Action |
|---|---|---|---|
| **AUTH_EXPIRED** | Session expired, token invalid | Toast + redirect to `/login` with `?redirect=current_path` | Auto-refresh attempted first |
| **AUTH_FORBIDDEN** | RLS denied, wrong user | Toast "You don't have access to this resource" | Redirect to dashboard |
| **NETWORK_OFFLINE** | No internet, DNS failure | Banner "You're offline. Changes will sync when reconnected" | Queue mutations, retry on reconnect |
| **NETWORK_TIMEOUT** | API > 10s | Toast "Request timed out. Retrying..." | Auto-retry 1x, then show manual retry button |
| **AI_UNAVAILABLE** | All AI providers down | Inline "AI is temporarily busy" with fallback content | Show cached content if available, else deterministic fallback |
| **AI_INVALID_RESPONSE** | AI returns unparseable JSON | Silent retry with different model | If all fail: "We couldn't generate content. Try again." |
| **AI_RATE_LIMITED** | Gemini/Groq quota hit | Toast "AI limit reached, using cached content" | Serve from `ai_artifacts` cache |
| **DB_WRITE_FAILED** | Supabase insert/update error | Toast "Failed to save. Retrying..." | Auto-retry 1x with exponential backoff |
| **DB_READ_FAILED** | Supabase select error | Show last cached data + stale indicator | Retry button + auto-retry after 5s |
| **VALIDATION_FAILED** | Zod schema rejection | Inline field error with specific message | Highlight field, focus, explain |
| **REALTIME_DISCONNECT** | WebSocket drops | Status indicator → yellow "Reconnecting..." | Auto-reconnect with backoff |
| **REALTIME_RECONNECTED** | WebSocket restored | Status indicator → green, fetch delta updates | Reconcile missed events from DB |
| **EMPTY_STATE** | No goals, no journeys, no data | Illustrated empty state with clear CTA | "Create your first learning journey" button |
| **NOT_FOUND** | Invalid activityId, conceptId, goalId | Full-page 404 with navigation back | "Go to Dashboard" button |
| **GOAL_CREATION_PARTIAL** | AI succeeded but DB write failed | "Your roadmap was generated but couldn't be saved. Retrying..." | Auto-retry save with cached AI result |
| **CONCURRENT_MODIFICATION** | Two tabs submit same answer | Accept first, show "Already submitted" for second | Dedup by `user_id + question_id + activityId` unique constraint |
| **QUOTA_EXCEEDED** | Supabase free tier row limits | Admin alert, graceful feature degradation | Archive old journeys, show storage indicator |

### Per-Component Error Boundaries

Every major section wrapped in an error boundary with graceful fallback:

```
<ErrorBoundary fallback={<SectionError section="Knowledge Terrain" />}>
  <KnowledgeTerrainMap />
</ErrorBoundary>

<ErrorBoundary fallback={<SectionError section="Next Best Action" />}>
  <NextBestActionCard />
</ErrorBoundary>

<ErrorBoundary fallback={<SectionError section="Practice" />}>
  <PracticeSection />
</ErrorBoundary>
```

### Network Resilience Layer

#### [NEW] `src/lib/utils/resilientFetch.ts`
```typescript
async function resilientSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: {
    retries?: number;        // default 1
    timeoutMs?: number;      // default 8000 (under Vercel 10s limit)
    fallbackData?: T;        // cached fallback
    onRetry?: () => void;    // UI feedback hook
  }
): Promise<{ data: T; fromCache: boolean; error: string | null }>
```

### Toast System

#### [MODIFY] [ToastContext.tsx](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/components/shared/ToastContext.tsx)
- Typed toast variants: `success`, `error`, `warning`, `info`, `loading`
- Auto-dismiss: success/info 4s, warning 6s, error stays until dismissed
- Stacking: max 3 visible, queue remaining
- Position: bottom-right on desktop, bottom-center on mobile
- Accessible: `role="alert"` with `aria-live="polite"`

---

## Proposed Changes

### Phase 1: Database Security + New Tables + Realtime

---

#### [MODIFY] [schema.sql](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/supabase/schema.sql)
Replace legacy travel schema with canonical education schema.

#### [NEW] `supabase/migrations/07_fix_rls_policies.sql`
- Remove ALL `or true` from RLS policies
- `learner_concept_state`: SELECT → `auth.uid() = user_id`, INSERT/UPDATE → `auth.uid() = user_id`
- `attempts`: SELECT → `auth.uid() = user_id`, INSERT → `auth.uid() = user_id`
- `misconceptions`: SELECT → `auth.uid() = user_id`, INSERT/UPDATE → `auth.uid() = user_id`
- `route_events`: SELECT → `auth.uid() = user_id`, INSERT → `auth.uid() = user_id`
- `evidence`: SELECT → `auth.uid() = user_id`, INSERT → `auth.uid() = user_id`, UPDATE → `auth.uid() = user_id`
- Teacher override: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')` for SELECT on student data
- Goals, journeys: SELECT own only, INSERT/UPDATE own only

#### [NEW] `supabase/migrations/08_new_tables_and_realtime.sql`
```sql
-- AI Artifacts Cache
CREATE TABLE public.ai_artifacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_type text NOT NULL CHECK (artifact_type IN ('roadmap', 'content', 'diagnostic', 'misconception', 'evidence_eval', 'resource_extract', 'challenge')),
  input_hash text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'v1',
  response_json jsonb NOT NULL,
  token_estimate int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  CONSTRAINT unique_artifact_hash UNIQUE (artifact_type, input_hash, prompt_version)
);

-- Spaced Review Schedule
CREATE TABLE public.review_schedule (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE NOT NULL,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  interval_days int NOT NULL DEFAULT 1,
  ease_factor numeric NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  review_count int NOT NULL DEFAULT 0,
  last_result text CHECK (last_result IN ('success', 'failure', 'skip')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_concept_review UNIQUE (user_id, concept_id)
);

-- Mastery Policies (concept-specific or domain-level)
CREATE TABLE public.mastery_policies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE,
  domain text,
  required_evidence_types jsonb NOT NULL DEFAULT '["practice"]',
  minimum_score int NOT NULL DEFAULT 85 CHECK (minimum_score BETWEEN 50 AND 100),
  minimum_confidence numeric NOT NULL DEFAULT 0.85 CHECK (minimum_confidence BETWEEN 0.0 AND 1.0),
  minimum_distinct_evidence int NOT NULL DEFAULT 2 CHECK (minimum_distinct_evidence >= 1),
  created_at timestamptz DEFAULT now()
);

-- Structured Resource Items
CREATE TABLE public.resource_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  concept_id uuid REFERENCES public.concepts ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('docs', 'article', 'video', 'book', 'practice', 'interactive')),
  platform text NOT NULL DEFAULT 'Web',
  quality_score numeric DEFAULT 0.8 CHECK (quality_score BETWEEN 0.0 AND 1.0),
  duration_minutes int,
  validated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_artifacts_hash ON public.ai_artifacts (artifact_type, input_hash);
CREATE INDEX idx_ai_artifacts_expires ON public.ai_artifacts (expires_at);
CREATE INDEX idx_review_schedule_user ON public.review_schedule (user_id);
CREATE INDEX idx_review_schedule_next ON public.review_schedule (next_review_at);
CREATE INDEX idx_resource_items_concept ON public.resource_items (concept_id);

-- RLS
ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_artifacts_read" ON public.ai_artifacts FOR SELECT USING (true);
CREATE POLICY "ai_artifacts_insert" ON public.ai_artifacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "review_own" ON public.review_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "mastery_policies_read" ON public.mastery_policies FOR SELECT USING (true);
CREATE POLICY "resource_items_read" ON public.resource_items FOR SELECT USING (true);
CREATE POLICY "resource_items_manage" ON public.resource_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Enable Realtime on ALL tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.learner_concept_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attempts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.misconceptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.route_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.concepts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_schedule;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_artifacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_items;
```

#### [MODIFY] [seed.sql](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/supabase/seed.sql)
Replace tourism data with `-- No production seed data. Test fixtures are in engine/__tests__/`

---

### Phase 2: AI Architecture Overhaul

---

#### [MODIFY] [geminiClient.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/ai/geminiClient.ts)
- Update Groq models: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `qwen/qwen3.6-27b`
- Add HuggingFace third-tier fallback
- DB-backed artifact caching via `ai_artifacts` table
- Deep roadmap prompt: 15-35 concepts with module clusters
- `generateRichRoadmap()` for deep knowledge terrain
- `generateRichContent()` for learning module sections (WHY/INTUITION/THEORY/etc.)
- All AI calls timeout at 8s (under Vercel 10s limit)

#### [MODIFY] [schemas.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/ai/schemas.ts)
- Extend concept limits: `.min(8).max(50)`
- Add `candidateRichContentSchema` (WHY/INTUITION/THEORY/EXAMPLES/EDGE_CASES sections)
- Add `candidateCodeEvaluationSchema`
- Add `candidateChallengeSchema`

#### [NEW] `src/lib/ai/modelRouter.ts`
Task classification → model selection → fallback chain → rate limiting

#### [NEW] `src/lib/ai/artifactCache.ts`
DB-backed cache with deterministic hashing + TTL

---

### Phase 3: Engine Layer Enhancement

---

#### [MODIFY] [adaptiveRouter.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/adaptiveRouter.ts)
Weighted scoring: `prerequisiteReadiness + misconceptionUrgency + goalRelevance + unlockValue + masteryNeed + reviewNeed - estimatedEffortPenalty`

#### [MODIFY] [knowledgeGapDetector.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/knowledgeGapDetector.ts)
Add `urgentReviews`, `recommendedActions`, cluster analysis

#### [NEW] `src/lib/engine/spacedReview.ts`
Deterministic SM-2 scheduling

#### [NEW] `src/lib/engine/masteryPolicyManager.ts`
Per-concept/domain mastery policies

#### [MODIFY] [graphValidator.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/engine/graphValidator.ts)
Add centrality computation, BFS shortest path

---

### Phase 4: Interactive Knowledge Terrain (Signature Feature)

---

#### [MODIFY] [KnowledgeGraphMap.tsx](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/components/learning/KnowledgeGraphMap.tsx)
Complete rewrite → Pure SVG Interactive Knowledge Terrain with:
- Zoom/pan via CSS transforms + wheel/touch events
- Minimap overlay
- State-colored nodes with animated edges
- Route highlighting with glow
- Module clustering with expandable groups
- Real-time node state updates via Realtime subscription
- Click → Inspector panel
- Keyboard navigation (Tab/Arrow)
- Mobile touch-friendly list fallback
- All state transition animations from the micro-animation spec above

#### [NEW] `src/components/learning/ConceptInspector.tsx`
#### [NEW] `src/components/learning/KnowledgeTerrainMinimap.tsx`

---

### Phase 5: Rich Learning Experience

---

#### [MODIFY] [learn/[activityId]/page.tsx](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/app/app/learn/%5BactivityId%5D/page.tsx)
Three-panel study workspace with progressive disclosure

#### [NEW] `src/components/learning/CodeEditor.tsx`
#### [NEW] `src/components/learning/EvidenceSubmission.tsx`
#### [NEW] `src/components/learning/RichContentRenderer.tsx`
#### [NEW] `src/components/learning/DifficultyLadder.tsx`

---

### Phase 6: Multi-Modal Assessment

---

#### [NEW] `src/lib/engine/assessmentEngine.ts`
#### [NEW] `src/app/actions/evidenceActions.ts`
#### [MODIFY] [learningActions.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/app/actions/learningActions.ts)

---

### Phase 7: Deep Roadmap Generation

---

#### [MODIFY] [GoalWizardModal.tsx](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/components/learning/GoalWizardModal.tsx)
5-step wizard with visual roadmap preview, non-blocking progressive generation

---

### Phase 8: Resource Intelligence

---

#### [MODIFY] [resourceCatalog.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/learning/resourceCatalog.ts)
#### [NEW] `src/app/actions/resourceActions.ts`

---

### Phase 9: Teacher Dashboard

---

#### [NEW] `src/app/app/teacher/page.tsx`
Real-time student mastery overview, misconception heatmap, stalled learner alerts

---

### Phase 10: Premium UI Overhaul + Realtime Integration

---

#### [MODIFY] `src/styles/index.css`
Full design token system from specification above

#### [MODIFY] All page components
Apply design tokens consistently, connect Realtime hooks

#### [NEW] `src/hooks/useRealtimeSubscription.ts`
#### [NEW] `src/hooks/useRealtimeLearnerState.ts`
#### [NEW] `src/hooks/useRealtimeMisconceptions.ts`
#### [NEW] `src/hooks/useRealtimeRouteEvents.ts`
#### [NEW] `src/components/shared/RealtimeStatus.tsx`
#### [NEW] `src/lib/utils/resilientFetch.ts`

---

### Phase 11: Performance + Vercel Optimization

---

#### [NEW] `vercel.json`
#### [MODIFY] `next.config.js`
#### [NEW] `src/lib/utils/queryOptimizer.ts`
#### [MODIFY] [journeyDbService.ts](file:///Users/subhajit/Developer/Development/SIH%202026/Ghoomo/src/lib/services/journeyDbService.ts)

---

### Phase 12: Testing & Deployment

---

#### [MODIFY] existing test files
#### [NEW] `src/lib/engine/__tests__/spacedReview.test.ts`
#### [NEW] `src/lib/engine/__tests__/masteryPolicyManager.test.ts`
#### [NEW] `src/lib/engine/__tests__/assessmentEngine.test.ts`
#### [NEW] `src/lib/engine/__tests__/realtimeIntegration.test.ts`

---

## Verification Plan

### Automated Tests
```bash
npm run test:engine    # All engine unit tests
npx tsc --noEmit       # TypeScript compilation
npm run lint           # ESLint
npm run build          # Production build (Vercel compatible)
```

### Manual Verification
1. **Two-browser demo**: Account A + Account B → same goal → different routes → visible in real-time
2. **Realtime proof**: Submit answer in Browser A → learner state updates in Browser A AND teacher dashboard updates in Browser B instantly
3. **Misconception flow**: Wrong answer → NEEDS_REVIEW state visible on Knowledge Terrain instantly → remediation inserted → route visibly changes
4. **RLS verification**: User A cannot access User B's learner state
5. **AI cost check**: Cached content = 0 AI calls; route calculation = 0 AI calls
6. **Offline resilience**: Disconnect wifi → app shows offline banner → reconnect → data syncs
7. **Vercel deployment**: `vercel --prod` succeeds, all routes functional
8. **Error recovery**: Kill Supabase connection → app shows degraded state → reconnect → auto-recovers

### Deployment Checklist
```bash
# 1. Environment variables on Vercel
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GROQ_API_KEY
HUGGINGFACE_API_KEY
NEXT_PUBLIC_APP_URL

# 2. Build and deploy
vercel --prod

# 3. Verify
# - Auth flow works
# - Realtime subscriptions connect
# - AI calls complete within 10s
# - Knowledge terrain renders
# - Mobile responsive
```

---

## Implementation Order

| # | Phase | What | Key Deliverable |
|---|---|---|---|
| 1 | **DB Security + Realtime** | Fix RLS, add tables, enable Realtime on all tables | Secure, real-time database |
| 2 | **AI Overhaul** | Model router, HuggingFace, persistent cache, deep prompts | Cost-efficient AI with 3-tier fallback |
| 3 | **Engine Enhancement** | Weighted router, spaced review, per-concept mastery | Genuinely adaptive routing |
| 4 | **Knowledge Terrain** | Interactive SVG graph with zoom/pan/minimap/states | Signature visual differentiator |
| 5 | **Rich Learning** | Three-panel workspace, code editor, evidence submission | Beyond-MCQ learning experience |
| 6 | **Multi-Modal Assessment** | Assessment engine, difficulty ladder | Concept-appropriate evaluation |
| 7 | **Deep Roadmap** | 15-35+ concept roadmaps with modules | Knowledge terrain, not course list |
| 8 | **Resource Intelligence** | Concept mapping, personalized study plans | Resource navigation |
| 9 | **Teacher Dashboard** | Real-time mastery overview, misconception heatmap | Learning intelligence |
| 10 | **Premium UI + Realtime Hooks** | Design tokens, animations, real-time subscriptions | Premium, alive experience |
| 11 | **Vercel Optimization** | Config, timeouts, caching, ISR | Free-tier production deployment |
| 12 | **Testing + Deploy** | Full test suite, build, `vercel --prod` | Production-ready |

> [!CAUTION]
> This spans 60+ files across 12 phases. Each phase is implemented sequentially and verified. The Knowledge Terrain (Phase 4) + Realtime Integration (Phase 10) together create the "alive" UX that makes Ghoomo feel like a living navigation instrument.
