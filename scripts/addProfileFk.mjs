import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function addProfileFk() {
  await sql`ALTER TABLE public.student_progress DROP CONSTRAINT IF EXISTS fk_student_progress_profile;`;
  await sql`
    ALTER TABLE public.student_progress
      ADD CONSTRAINT fk_student_progress_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  `;
  await sql`ALTER TABLE public.reflections DROP CONSTRAINT IF EXISTS fk_reflections_profile;`;
  await sql`
    ALTER TABLE public.reflections
      ADD CONSTRAINT fk_reflections_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  `;
  console.log('✅ Foreign keys to public.profiles added to student_progress and reflections');
  process.exit(0);
}

addProfileFk().catch(err => {
  console.error(err);
  process.exit(1);
});
