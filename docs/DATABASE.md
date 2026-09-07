# Ghoomo - Database Architecture & Schema

## 1. Relational Entity Overview

The Ghoomo database schema is built on Supabase PostgreSQL with strict Row Level Security (RLS) and real-time publication subscriptions:

- **`profiles`**: User accounts extending Supabase `auth.users` with roles (`learner`, `student`, `admin`), language preference, and learning modality.
- **`learning_goals`**: Learner-defined outcomes, daily study targets, and status (`active`, `completed`, `abandoned`, `archived`).
- **`learning_journeys`**: Personalized adaptive curricula linking goals to knowledge terrain graphs.
- **`concepts`**: Verified competency nodes in the domain knowledge graph with module groupings and mastery thresholds.
- **`concept_prerequisites`**: Validated DAG edges enforcing strict prerequisite sequencing with cycle prevention.
- **`learner_concept_state`**: The epistemic mastery ledger recording state (`UNKNOWN` through `MASTERED`), confidence, and mastery scores.
- **`learning_activities`**: Pedagogical tasks categorized by type (`DIAGNOSE`, `EXPLAIN`, `PRACTICE`, `APPLY`, `REMEDIATE`, `PROVE`, `REFLECT`).
- **`questions`**: Formative checkpoints with automated distractors and misconception tagging.
- **`attempts`**: Historical submission telemetry tracking time spent, rationale, and score.
- **`misconceptions`**: Diagnostic error tracking with mapped remediation activities.
- **`evidence`**: Open-ended code and explanation submissions evaluated by AI with deterministic mastery thresholds.
- **`route_events`**: Immutable audit log of every dynamic reroute, skip, or remediation insertion.
- **`ai_artifacts`**: Two-tiered L2 persistent cache for AI responses with SHA-256 content hashing and TTL expiration.
- **`review_schedule`**: Spaced repetition SM-2 review queue.
- **`mastery_policies`**: Domain and concept-specific threshold configurations.
- **`resource_items`**: Live-discovered and curated learning resources with quality scores and type tags.

---

## 2. Row Level Security (RLS) Principles

1. **Strict Learner Isolation**: Learners can only query, insert, and update their own state, attempts, misconceptions, and evidence (`auth.uid() = user_id`).
2. **Admin Oversight**: Verified platform administrators (`profiles.role = 'admin'`) have read permissions across system telemetry, attempts, and learning states.
3. **Public Read-Only Catalog**: Concepts, activities, and questions are queryable by authenticated users for shared learning pathways.
