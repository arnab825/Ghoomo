import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
});

async function updateRubricConstraints() {
  await sql`
    ALTER TABLE public.reflections
      DROP CONSTRAINT IF EXISTS reflections_rubric_depth_check,
      DROP CONSTRAINT IF EXISTS reflections_rubric_accuracy_check,
      DROP CONSTRAINT IF EXISTS reflections_rubric_synthesis_check;
  `;
  await sql`
    ALTER TABLE public.reflections
      ADD CONSTRAINT reflections_rubric_depth_check CHECK (rubric_depth BETWEEN 0 AND 100),
      ADD CONSTRAINT reflections_rubric_accuracy_check CHECK (rubric_accuracy BETWEEN 0 AND 100),
      ADD CONSTRAINT reflections_rubric_synthesis_check CHECK (rubric_synthesis BETWEEN 0 AND 100);
  `;
  console.log('✅ Rubric constraints updated to allow 0-100 percentage scores in PostgreSQL!');
  process.exit(0);
}

updateRubricConstraints().catch(err => {
  console.error(err);
  process.exit(1);
});
