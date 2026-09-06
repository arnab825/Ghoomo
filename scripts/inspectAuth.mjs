import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function inspect() {
  const triggers = await sql`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users';
  `;
  console.log('Triggers on auth.users:', triggers);

  const sampleUser = await sql`
    SELECT id, email, role, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data
    FROM auth.users
    WHERE email = 'teacher@demo.edu';
  `;
  console.log('Sample user in auth.users:', sampleUser[0]);

  const proc = await sql`SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`;
  console.log('handle_new_user body:\n', proc[0]?.prosrc);

  // Check auth.identities columns
  const identCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'identities';
  `;
  console.log('auth.identities columns:', identCols);

  process.exit(0);
}

inspect().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
