import fs from 'fs/promises';
import path from 'path';
import { GhoomoTrip } from '@/lib/types/ghoomo';

const TRIPS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'trips.json');

async function ensureFileExists(): Promise<void> {
  try {
    await fs.access(TRIPS_FILE_PATH);
  } catch {
    const dir = path.dirname(TRIPS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(TRIPS_FILE_PATH, '[]', 'utf-8');
  }
}

export async function getServerTrips(): Promise<GhoomoTrip[]> {
  try {
    await ensureFileExists();
    const raw = await fs.readFile(TRIPS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[TripStore] Failed to read server trips:', error);
    return [];
  }
}

export async function getServerTripById(id: string): Promise<GhoomoTrip | null> {
  const trips = await getServerTrips();
  return trips.find((t) => t.id === id) || null;
}

export async function saveServerTrip(trip: GhoomoTrip): Promise<GhoomoTrip> {
  await ensureFileExists();
  const trips = await getServerTrips();
  const existingIdx = trips.findIndex((t) => t.id === trip.id);

  if (existingIdx >= 0) {
    trips[existingIdx] = { ...trips[existingIdx], ...trip, updatedAt: new Date().toISOString() };
  } else {
    trips.unshift(trip);
  }

  await fs.writeFile(TRIPS_FILE_PATH, JSON.stringify(trips, null, 2), 'utf-8');
  return trip;
}

export async function saveMultipleServerTrips(newTrips: GhoomoTrip[]): Promise<GhoomoTrip[]> {
  if (!newTrips || newTrips.length === 0) return getServerTrips();
  await ensureFileExists();
  const trips = await getServerTrips();

  for (const t of newTrips) {
    const idx = trips.findIndex((existing) => existing.id === t.id);
    if (idx >= 0) {
      trips[idx] = { ...trips[idx], ...t, updatedAt: new Date().toISOString() };
    } else {
      trips.unshift(t);
    }
  }

  await fs.writeFile(TRIPS_FILE_PATH, JSON.stringify(trips, null, 2), 'utf-8');
  return trips;
}

export async function deleteServerTrip(id: string): Promise<boolean> {
  await ensureFileExists();
  const trips = await getServerTrips();
  const filtered = trips.filter((t) => t.id !== id);
  if (filtered.length === trips.length) return false;

  await fs.writeFile(TRIPS_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
