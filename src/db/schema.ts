import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ============================================================================
// 1. Trips Table
// ============================================================================
export const trips = pgTable('trips', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  title: text('title').notNull(),
  destinationRegion: text('destination_region').notNull(),
  startDate: text('start_date'),
  durationDays: integer('duration_days').default(3),
  budgetTotal: numeric('budget_total').default('15000'),
  travelStyle: text('travel_style').default('friends'),
  coverImage: text('cover_image'),
  status: text('status').default('planned'),
  placesData: jsonb('places_data'),
  itineraryData: jsonb('itinerary_data'),
  budgetEstimate: jsonb('budget_estimate'),
  checklistData: jsonb('checklist_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 2. Trip Sources (Instagram Reels, YouTube Shorts, TikTok, Blogs)
// ============================================================================
export const tripSources = pgTable('trip_sources', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  platform: text('platform').default('instagram'),
  title: text('title'),
  author: text('author'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 3. Places Table
// ============================================================================
export const places = pgTable('places', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  lat: numeric('lat').notNull(),
  lng: numeric('lng').notNull(),
  category: text('category').default('attraction'),
  confidence: numeric('confidence').default('0.9'),
  provenance: text('provenance').default('creator_visual'),
  sourceType: text('source_type').default('ai'),
  description: text('description'),
  estimatedDuration: integer('estimated_duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// 4. Polls & Collaborative Decision Tables
// ============================================================================
export const polls = pgTable('polls', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const votes = pgTable('votes', {
  id: text('id').primaryKey(),
  pollId: text('poll_id').references(() => polls.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  optionIndex: integer('option_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type DbTrip = typeof trips.$inferSelect;
export type NewDbTrip = typeof trips.$inferInsert;
export type DbPlace = typeof places.$inferSelect;
export type NewDbPlace = typeof places.$inferInsert;
