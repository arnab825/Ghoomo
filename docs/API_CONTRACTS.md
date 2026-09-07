# Ghoomo - API Contracts & Server Actions

## 1. Authentication & Security Endpoints

### Login / Signup (`src/app/actions/authActions.ts`)
- Strict Zod validation on email, password, full name, language, and modality.
- Rate-limited sliding window with exponential backoff on failure.

---

## 2. Learning Curriculum Server Actions

### Goal & Journey Creation (`src/app/actions/goalActions.ts`)
- **`createLearningGoalAction`**: Validates title, target domain, and daily minutes; invokes AI blueprint generation; persists DAG to `concepts` and `concept_prerequisites`.
- **`archiveGoalAction`**: Sets goal status to `archived` with immediate query cache invalidation.

---

## 3. Assessment & Navigation Server Actions

### Attempt Evaluation (`src/app/actions/attemptActions.ts`)
- Evaluates MCQ and short answer submissions.
- Executes deterministic state transitions in `learner_concept_state`.
- Emits audit records to `route_events`.

### Evidence Evaluation (`src/app/actions/evidenceActions.ts`)
- Accepts text, code, or project link evidence.
- AI evaluates content depth, while deterministic mastery policies promote concept state.

### Resource Intelligence (`src/app/actions/resourceActions.ts`)
- Retrieves curated and live-discovered learning materials for any concept node.
