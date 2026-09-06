import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function checkAllTriggers() {
  await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;

  const allTriggers = await sql`
    SELECT trigger_schema, event_object_table, trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'auth';
  `;
  console.log('All auth triggers after drop:', allTriggers);

  process.exit(0);
}

checkAllTriggers().catch(err => {
  console.error(err);
  process.exit(1);
});
