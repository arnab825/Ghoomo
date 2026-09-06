import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function addConstraint() {
  await sql`
    ALTER TABLE public.student_progress
    DROP CONSTRAINT IF EXISTS unique_student_activity_progress;
  `;
  await sql`
    ALTER TABLE public.student_progress
    ADD CONSTRAINT unique_student_activity_progress
    UNIQUE (journey_id, user_id, activity_id);
  `;
  console.log('✅ Unique constraint unique_student_activity_progress added to student_progress');
  process.exit(0);
}

addConstraint().catch(err => {
  console.error(err);
  process.exit(1);
});
