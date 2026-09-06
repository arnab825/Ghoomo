import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function fixNulls() {
  console.log('Fixing NULL strings in auth.users for GoTrue compatibility...');

  await sql`
    UPDATE auth.users
    SET
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, '');
  `;

  console.log('✅ All null string tokens updated to empty strings.');
  process.exit(0);
}

fixNulls().catch(err => {
  console.error(err);
  process.exit(1);
});
