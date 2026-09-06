import { db, schema, isDrizzleConnected } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { GhoomoTrip } from '@/lib/types/ghoomo';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using service role key
function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (key.endsWith('*')) key = key.slice(0, -1);
  if (!url || !key || url.includes('mock.supabase.co')) return null;
  return createClient(url, key);
}

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

export class TripRepository {
  /**
   * Fetch all trips using Drizzle ORM (with Supabase fallback)
   */
  static async getAllTrips(): Promise<GhoomoTrip[]> {
    // 1. Try Drizzle ORM
    if (isDrizzleConnected() && db) {
      try {
        const rows = await db
          .select()
          .from(schema.trips)
          .orderBy(desc(schema.trips.createdAt));

        if (rows && rows.length > 0) {
          return rows.map((r) => this.mapDbRowToTrip(r));
        }
      } catch (err) {
        console.warn('[TripRepository] Drizzle select error:', err);
      }
    }

    // 2. Try Supabase REST Client
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            destinationRegion: d.destination_region || d.destination_city || '',
            startDate: d.start_date,
            durationDays: d.duration_days || 3,
            budgetTotal: Number(d.budget_total) || 15000,
            travelStyle: d.travel_style || 'friends',
            coverImage: d.cover_image || DEFAULT_COVER_IMAGE,
            status: d.status || 'planned',
            sources: Array.isArray(d.sources) ? d.sources : [],
            places: Array.isArray(d.places_data) ? d.places_data : [],
            days: Array.isArray(d.itinerary_data) ? d.itinerary_data : (d.plan_data?.days || []),
            collaborators: Array.isArray(d.collaborators) ? d.collaborators : [],
            budgetItems: Array.isArray(d.budget_items) ? d.budget_items : [],
            checklistItems: Array.isArray(d.checklist_data) ? d.checklist_data : [],
            budgetBreakdown: d.budget_estimate,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('[TripRepository] Supabase REST select error:', err);
      }
    }

    return [];
  }

  /**
   * Fetch trip by ID using Drizzle ORM (with Supabase fallback)
   */
  static async getTripById(id: string): Promise<GhoomoTrip | null> {
    if (isDrizzleConnected() && db) {
      try {
        const [row] = await db
          .select()
          .from(schema.trips)
          .where(eq(schema.trips.id, id))
          .limit(1);

        if (row) return this.mapDbRowToTrip(row);
      } catch (err) {
        console.warn('[TripRepository] Drizzle getById error:', err);
      }
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            destinationRegion: data.destination_region || data.destination_city || '',
            startDate: data.start_date,
            durationDays: data.duration_days || 3,
            budgetTotal: Number(data.budget_total) || 15000,
            travelStyle: data.travel_style || 'friends',
            coverImage: data.cover_image || DEFAULT_COVER_IMAGE,
            status: data.status || 'planned',
            sources: Array.isArray(data.sources) ? data.sources : [],
            places: Array.isArray(data.places_data) ? data.places_data : [],
            days: Array.isArray(data.itinerary_data) ? data.itinerary_data : [],
            collaborators: Array.isArray(data.collaborators) ? data.collaborators : [],
            budgetItems: Array.isArray(data.budget_items) ? data.budget_items : [],
            checklistItems: Array.isArray(data.checklist_data) ? data.checklist_data : [],
            budgetBreakdown: data.budget_estimate,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('[TripRepository] Supabase getById error:', err);
      }
    }

    return null;
  }

  /**
   * Save or update trip using Drizzle ORM to active Supabase database
   */
  static async saveTrip(trip: GhoomoTrip): Promise<GhoomoTrip> {
    // 1. Save with Drizzle ORM
    if (isDrizzleConnected() && db) {
      try {
        await db
          .insert(schema.trips)
          .values({
            id: trip.id,
            userId: trip.userId || null,
            title: trip.title,
            destinationRegion: trip.destinationRegion,
            startDate: trip.startDate || null,
            durationDays: trip.durationDays || 3,
            budgetTotal: String(trip.budgetTotal || 15000),
            travelStyle: trip.travelStyle || 'friends',
            coverImage: trip.coverImage || DEFAULT_COVER_IMAGE,
            status: trip.status || 'planned',
            placesData: trip.places || [],
            itineraryData: trip.days || [],
            budgetEstimate: trip.budgetBreakdown || null,
            checklistData: trip.checklistItems || [],
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.trips.id,
            set: {
              title: trip.title,
              destinationRegion: trip.destinationRegion,
              durationDays: trip.durationDays,
              budgetTotal: String(trip.budgetTotal || 15000),
              placesData: trip.places || [],
              itineraryData: trip.days || [],
              budgetEstimate: trip.budgetBreakdown || null,
              checklistData: trip.checklistItems || [],
              updatedAt: new Date(),
            },
          });

        console.log(`[TripRepository] Trip ${trip.id} successfully saved to Supabase via Drizzle ORM`);
      } catch (err) {
        console.warn('[TripRepository] Drizzle insert/upsert error:', err);
      }
    }

    // 2. Dual-save with Supabase REST client
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const payload = {
          id: trip.id,
          user_id: trip.userId || null,
          title: trip.title,
          destination_region: trip.destinationRegion,
          duration_days: trip.durationDays || 3,
          budget_total: Number(trip.budgetTotal) || 15000,
          travel_style: trip.travelStyle || 'friends',
          cover_image: trip.coverImage || DEFAULT_COVER_IMAGE,
          status: trip.status || 'planned',
          places_data: trip.places || [],
          itinerary_data: trip.days || [],
          budget_estimate: trip.budgetBreakdown || null,
          checklist_data: trip.checklistItems || [],
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('trips').upsert(payload, { onConflict: 'id' });
        if (!error) {
          console.log(`[TripRepository] Trip ${trip.id} synced with Supabase REST client`);
        }
      } catch (err) {
        console.warn('[TripRepository] Supabase REST upsert error:', err);
      }
    }

    return trip;
  }

  private static mapDbRowToTrip(r: schema.DbTrip): GhoomoTrip {
    return {
      id: r.id,
      userId: r.userId || undefined,
      title: r.title,
      destinationRegion: r.destinationRegion,
      startDate: r.startDate || undefined,
      durationDays: r.durationDays || 3,
      budgetTotal: Number(r.budgetTotal) || 15000,
      travelStyle: (r.travelStyle as any) || 'friends',
      coverImage: r.coverImage || DEFAULT_COVER_IMAGE,
      status: (r.status as any) || 'planned',
      sources: [],
      places: Array.isArray(r.placesData) ? (r.placesData as any) : [],
      days: Array.isArray(r.itineraryData) ? (r.itineraryData as any) : [],
      collaborators: [],
      budgetItems: [],
      checklistItems: Array.isArray(r.checklistData) ? (r.checklistData as any) : [],
      budgetBreakdown: r.budgetEstimate,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
