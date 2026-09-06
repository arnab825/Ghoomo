import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function fixTrigger() {
  console.log('Fixing handle_new_user security definer and permissions...');

  // 1. Redefine function with SECURITY DEFINER and search_path
  await sql`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', null)
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role);
      RETURN NEW;
    END;
    $$;
  `;

  // 2. Grant permissions to supabase_auth_admin
  await sql`GRANT USAGE ON SCHEMA public TO supabase_auth_admin;`;
  await sql`GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;`;
  await sql`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;`;

  // 3. Drop existing triggers and recreate ONLY for AFTER INSERT
  await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;
  await sql`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  console.log('✅ Trigger fixed: SECURITY DEFINER enabled and permissions granted to supabase_auth_admin!');
  process.exit(0);
}

fixTrigger().catch(err => {
  console.error('Trigger fix error:', err);
  process.exit(1);
});
