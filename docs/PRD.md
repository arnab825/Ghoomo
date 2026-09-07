# Ghoomo - Product Requirements Document (PRD)

## Product Name
**Ghoomo: Adaptive Learning Navigation Engine**

### Problem Statement
**Smart India Hackathon (SIH) 2026 — Problem Statement 26207: Smart Education**

---

## 1. Executive Summary

Ghoomo is an AI-powered, real-time **Adaptive Learning Navigation Engine** designed for Computer Science and Software Engineering learners. Rather than acting as a static content repository or generic quiz generator, Ghoomo functions like **Google Maps for learning**.

It evaluates what a learner knows, constructs a verified **Directed Acyclic Graph (DAG)** of competencies, administers deterministic diagnostic evaluations, dynamically routes learners around prerequisites and misconceptions, surfaces authoritative technical resources, and maintains an auditable decision trail.

---

## 2. Core Product Philosophy & Tenets

1. **Learner-First Companion**: Direct one-to-one learning experience. No teacher administrative hierarchy needed for the core learner experience.
2. **Deterministic Code Decides Mastery**: AI evaluates open-ended explanations and code submissions, but strict, auditable TypeScript code rules decide state transitions, prerequisites, and promotions.
3. **Zero Mock Fallbacks**: Real AI generation powered by Google Gemini and Groq with persistent PostgreSQL caching (`ai_artifacts`) and in-memory LRU buffering.
4. **Transparent Navigation**: Every reroute, prerequisite insertion, and diagnostic waiver is permanently logged in `route_events`.
5. **Authoritative Resource Intelligence**: Connects learners to official documentation, primary RFCs, and curated engineering articles.

---

## 3. Target Personas

### 1. The Autonomous Learner
- Aspiring software engineers, college CS students, and self-taught developers.
- Wants structured, goal-driven mastery roadmaps that adapt dynamically when concepts are difficult.

### 2. The Platform Administrator
- Platform operations and pedagogical leads.
- Monitors learner throughput, misconception hotspots, AI token usage, system latency, and system health via the Admin Operations Center (`/admin`).

---

## 4. Key Functional Features

- **Goal Intake & Curriculum Engine**: Single-prompt comprehensive syllabus generation that creates verified DAGs with 0 circular dependencies.
- **Diagnostic Screening**: Rapid diagnostic challenges to test declared proficiency, promoting mastered skills and sequencing unmastered prerequisites.
- **Mastery Engine & Epistemic States**: 6 distinct states (`UNKNOWN`, `EXPOSED`, `PROVISIONALLY_READY`, `DEVELOPING`, `NEEDS_REVIEW`, `MASTERED`).
- **Realtime Resource Discovery**: Multi-source resource discovery and ranking for any technical concept.
- **Spaced Repetition Review (SM-2)**: Automated decay and review scheduling to reinforce mastered knowledge.
- **Security Hardening**: Sliding window rate limits, strict Zod schema validation, leak-free error handling, and binary-validated file uploads.
