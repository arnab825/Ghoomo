import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function diagnose() {
  console.log('--- Diagnosing auth schema permissions and roles ---');

  // Check roles
  const roles = await sql`SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'supabase_auth_admin', 'service_role');`;
  console.log('Roles found:', roles.map(r => r.rolname));

  // Check permissions on public.profiles
  const perms = await sql`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'profiles';
  `;
  console.log('Permissions on public.profiles:', perms);

  // Check if handle_new_user trigger fails when called
  const user = await sql`SELECT * FROM auth.users WHERE email = 'teacher@demo.edu';`;
  console.log('Teacher in auth.users:', user[0]);

  // Check auth.schema_migrations if it exists
  const migrations = await sql`SELECT * FROM auth.schema_migrations ORDER BY version DESC LIMIT 5;`;
  console.log('Latest auth schema migrations:', migrations);

  process.exit(0);
}

diagnose().catch(err => {
  console.error('Diagnosis error:', err);
  process.exit(1);
});
