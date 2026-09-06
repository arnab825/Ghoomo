# Ghoomo - Database Architecture & Schema

## 1. Relational Entity Overview

The Ghoomo database revolves around 8 core relational entities:

- **`profiles`**: Extends Supabase `auth.users` with display name, avatar, and travel style preferences.
- **`trips`**: Core trip entity (title, destination region, start date, duration in days, budget target, cover image).
- **`trip_sources`**: Ingested social media links (URL, platform, author handle, post title, thumbnail, timestamp).
- **`places`**: Discovered or manually added locations (lat, lng, city, state, confidence score, source traceability link, category, notes).
- **`itinerary_days`**: Scheduled calendar days within a trip (day number, date, theme/summary).
- **`itinerary_items`**: Scheduled stops within a day (assigned place ID, order index, time slot: Morning/Afternoon/Evening, notes).
- **`collaboration_invites`**: Access control records (trip ID, user email, role: Editor/Viewer, invite token).
- **`budget_items`**: Estimated & logged travel expenses (category, description, amount, payment status).
- **`checklist_items`**: Trip preparation tasks and packing checklist (title, category, completion status).

---

## 2. Row Level Security (RLS) Principles

1. **Trips & Sources**: Accessible to the trip creator and users with valid collaborator privileges.
2. **Places & Itinerary**: Viewable by all collaborators; editable only by the owner or users with the `editor` role.
3. **Budget & Checklist**: Accessible to all collaborators for transparent group trip coordination.
4. **Public Shared Trips**: Publicly accessible via unique share token in read-only mode for easy itinerary sharing.
