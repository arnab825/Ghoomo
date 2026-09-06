import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function enableTrigger() {
  await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`;
  await sql`
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;
  console.log('✅ on_auth_user_created trigger enabled for AFTER INSERT');
  process.exit(0);
}

enableTrigger().catch(err => {
  console.error(err);
  process.exit(1);
});
