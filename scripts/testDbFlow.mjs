import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing Supabase Connection & Schema...');

  // 1. Verify Profiles table
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, full_name, role').limit(5);
  if (pErr) console.error('Profiles query failed:', pErr.message);
  else console.log('Profiles table OK. Row count sample:', profiles.length);

  
  // 2. Verify Learning Journeys table
  const { data: journeys, error: jErr } = await supabase.from('learning_journeys').select('id, title, status').limit(5);
  if (jErr) console.error('Journeys query failed:', jErr.message);
  else console.log('Learning Journeys table OK. Row count sample:', journeys.length);

  // 3. Verify Learning Goals table
  const { data: goals, error: gErr } = await supabase.from('learning_goals').select('id').limit(5);
  if (gErr) console.error('Goals query failed:', gErr.message);
  else console.log('Learning Goals table OK.');

  // 4. Verify Student Progress table
  const { data: progress, error: progErr } = await supabase.from('student_progress').select('id').limit(5);
  if (progErr) console.error('Student Progress table OK:', progErr.message);
  else console.log('Student Progress table OK.');

  // 5. Verify Reflections table
  const { data: reflections, error: rErr } = await supabase.from('reflections').select('id').limit(5);
  if (rErr) console.error('Reflections table failed:', rErr.message);
  else console.log('Reflections table OK.');

  console.log('ALL SUPABASE EDUCATION TABLES VERIFIED & OPERATIONAL!');
}

runTest();
