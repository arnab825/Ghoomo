import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL ||
  '';

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString && !connectionString.includes('[YOUR_PASSWORD]') && !connectionString.includes('YOUR_PASSWORD')) {
  try {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Recommended for Supabase transaction pooler
    });
    dbInstance = drizzle(client, { schema });
  } catch (err) {
    console.warn('[Drizzle] Failed to initialize postgres client with connection string:', err);
  }
}

export const db = dbInstance;
export { schema };

export function isDrizzleConnected(): boolean {
  return dbInstance !== null;
}
