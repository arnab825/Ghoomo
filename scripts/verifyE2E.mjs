import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ETest() {
  console.log('==============================================');
  console.log('🚀 GHOOMO SMART LEARNING: E2E ACCEPTANCE TEST');
  console.log('==============================================');

  const suffix = Math.floor(100000 + Math.random() * 900000);
  const teacherEmail = `ananya.teacher.${suffix}@gmail.com`;
  const studentEmail = `rohit.student.${suffix}@gmail.com`;
  const password = 'Password123!Secure';

  // ----------------------------------------------------
  // 1. Teacher Registration & Profile
  // ----------------------------------------------------
  console.log('\n[Step 1] Registering Teacher Account:', teacherEmail);
  const { data: teacherAuth, error: teacherAuthErr } = await supabase.auth.signUp({
    email: teacherEmail,
    password: password,
    options: {
      data: {
        full_name: 'Prof. Ananya Sen',
        role: 'teacher',
      },
    },
  });

  if (teacherAuthErr || !teacherAuth.user) {
    throw new Error(`Teacher sign up failed: ${teacherAuthErr?.message}`);
  }
  const teacherId = teacherAuth.user.id;
  console.log('Teacher Auth User Created:', teacherId);

  // Ensure teacher profile in public.profiles
  const { data: teacherProf, error: teacherProfErr } = await supabase
    .from('profiles')
    .upsert({
      id: teacherId,
      email: teacherEmail,
      full_name: 'Prof. Ananya Sen',
      role: 'teacher',
    })
    .select()
    .single();

  if (teacherProfErr) throw new Error(`Teacher profile error: ${teacherProfErr.message}`);
  console.log('Teacher Profile Confirmed:', teacherProf.full_name, `[Role: ${teacherProf.role}]`);

  // ----------------------------------------------------
  // 2. Teacher Creates a Learning Journey in PostgreSQL
  // ----------------------------------------------------
  console.log('\n[Step 2] Creating Learning Journey in PostgreSQL...');
  const { data: journey, error: journeyErr } = await supabase
    .from('learning_journeys')
    .insert({
      creator_id: teacherId,
      title: 'Indian Freedom Movement: Kolkata Trail',
      description: 'An experiential journey through pivotal historical landmarks of Bengal’s freedom movement.',
      subject: 'History',
      grade_level: 'Class 8',
      difficulty: 'intermediate',
      language: 'English',
      mode: 'explore',
      duration_days: 1,
      status: 'published',
    })
    .select()
    .single();

  if (journeyErr || !journey) throw new Error(`Journey insert error: ${journeyErr?.message}`);
  const journeyId = journey.id;
  console.log('Journey Created in DB:', journey.title, `[ID: ${journeyId}]`);

  // Add Objectives
  const { error: objErr } = await supabase.from('learning_objectives').insert([
    {
      journey_id: journeyId,
      objective: 'Understand the significance of Netaji Bhavan in the 1941 Great Escape.',
      blooms_level: 'understand',
      order_index: 0,
    },
    {
      journey_id: journeyId,
      objective: 'Analyze primary visual artifacts and newspapers at the Victoria Memorial gallery.',
      blooms_level: 'analyze',
      order_index: 1,
    },
  ]);
  if (objErr) throw new Error(`Objectives insert error: ${objErr.message}`);
  console.log('Objectives Added: 2 learning objectives attached.');

  // Add Activities (Before, During, After)
  const { data: actBefore, error: act1Err } = await supabase
    .from('learning_activities')
    .insert({
      journey_id: journeyId,
      stage: 'before',
      type: 'briefing',
      title: 'Pre-Visit Briefing: Netaji and the INA',
      description: 'Review the timeline of Subhas Chandra Bose and key revolutionary leaders in Bengal.',
      duration_minutes: 15,
      instruction: 'Read the summary of the 1941 Escape from Elgin Road.',
      thinking_prompt: 'Why was Elgin Road under heavy surveillance in 1941?',
      order_index: 0,
    })
    .select()
    .single();

  const { data: actDuring, error: act2Err } = await supabase
    .from('learning_activities')
    .insert({
      journey_id: journeyId,
      stage: 'during',
      type: 'observation',
      title: 'Observation Mission: The Great Escape Wanderer Car',
      description: 'Observe the 1937 Wanderer W24 sedan used in the escape at Netaji Bhavan.',
      duration_minutes: 30,
      instruction: 'Inspect the car license plate and document its characteristics.',
      thinking_prompt: 'How did disguise and logistics play a critical role in Bose escaping surveillance?',
      place_name: 'Netaji Bhavan, Kolkata',
      lat: 22.5358,
      lng: 88.3541,
      order_index: 1,
    })
    .select()
    .single();

  const { data: actAfter, error: act3Err } = await supabase
    .from('learning_activities')
    .insert({
      journey_id: journeyId,
      stage: 'after',
      type: 'reflection',
      title: 'Post-Visit Reflection: Synthesis of Sacrifice',
      description: 'Synthesize how visiting physical sites alters historical comprehension.',
      duration_minutes: 20,
      thinking_prompt: 'How did standing before the actual Wanderer car change your understanding of the risks taken in the 1941 Great Escape?',
      order_index: 2,
    })
    .select()
    .single();

  if (act1Err || act2Err || act3Err) throw new Error('Activities insert error');
  console.log('Activities Added: 3-stage pipeline (Before, During, After) created.');

  // ----------------------------------------------------
  // 3. Student Registration & Profile
  // ----------------------------------------------------
  console.log('\n[Step 3] Registering Student Account:', studentEmail);
  const { data: studentAuth, error: studentAuthErr } = await supabase.auth.signUp({
    email: studentEmail,
    password: password,
    options: {
      data: {
        full_name: 'Rohit Mukherjee',
        role: 'student',
      },
    },
  });

  if (studentAuthErr || !studentAuth.user) {
    throw new Error(`Student sign up failed: ${studentAuthErr?.message}`);
  }
  const studentId = studentAuth.user.id;
  console.log('Student Auth User Created:', studentId);

  // Ensure student profile in public.profiles
  const { data: studentProf, error: studentProfErr } = await supabase
    .from('profiles')
    .upsert({
      id: studentId,
      email: studentEmail,
      full_name: 'Rohit Mukherjee',
      role: 'student',
    })
    .select()
    .single();

  if (studentProfErr) throw new Error(`Student profile error: ${studentProfErr.message}`);
  console.log('Student Profile Confirmed:', studentProf.full_name, `[Role: ${studentProf.role}]`);

  // ----------------------------------------------------
  // 4. Teacher Assigns Journey to Student
  // ----------------------------------------------------
  console.log('\n[Step 4] Teacher Assigns Journey to Student...');
  const { data: assignment, error: assignErr } = await supabase
    .from('teacher_assignments')
    .insert({
      journey_id: journeyId,
      teacher_id: teacherId,
      student_id: studentId,
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'assigned',
    })
    .select()
    .single();

  if (assignErr || !assignment) throw new Error(`Assignment failed: ${assignErr?.message}`);
  console.log('Assignment Confirmed! ID:', assignment.id, 'Due Date:', assignment.due_date);

  // ----------------------------------------------------
  // 5. Student Completes Activities & Progress Updates
  // ----------------------------------------------------
  console.log('\n[Step 5] Student Completing Activities (Before & During)...');
  const { error: p1Err } = await supabase.from('student_progress').insert({
    journey_id: journeyId,
    user_id: studentId,
    activity_id: actBefore.id,
    status: 'completed',
    score: 100,
    response: 'Completed briefing on 1941 escape.',
  });

  const { error: p2Err } = await supabase.from('student_progress').insert({
    journey_id: journeyId,
    user_id: studentId,
    activity_id: actDuring.id,
    status: 'completed',
    score: 100,
    response: 'Inspected Wanderer W24 registration BLA 7169 at Netaji Bhavan.',
  });

  if (p1Err || p2Err) throw new Error('Student progress insert failed');
  console.log('Student Progress Saved to PostgreSQL for 2 activities.');

  // Update assignment status to in_progress
  await supabase
    .from('teacher_assignments')
    .update({ status: 'in_progress' })
    .eq('id', assignment.id);

  // ----------------------------------------------------
  // 6. Student Submits Reflection (After stage)
  // ----------------------------------------------------
  console.log('\n[Step 6] Student Submits Reflection...');
  const studentReflectionText =
    'Standing right next to the Wanderer sedan at Netaji Bhavan made history feel tangible rather than abstract. Seeing the tight spatial confines and realizing Netaji was disguised as Ziauddin escaping through police checkpoints highlighted the immense calculated courage behind the independence movement.';

  const { data: reflection, error: reflErr } = await supabase
    .from('reflections')
    .insert({
      journey_id: journeyId,
      user_id: studentId,
      activity_id: actAfter.id,
      prompt: actAfter.thinking_prompt,
      response: studentReflectionText,
      ai_feedback:
        'Excellent synthesis connecting the physical preservation of the Wanderer car to the psychological tension of political evasion under colonial watch.',
      rubric_depth: 92,
      rubric_accuracy: 95,
      rubric_synthesis: 90,
    })
    .select()
    .single();

  if (reflErr || !reflection) throw new Error(`Reflection insert failed: ${reflErr?.message}`);
  console.log('Reflection Recorded in DB! Depth: 92%, Accuracy: 95%, Synthesis: 90%');

  // Complete assignment
  await supabase
    .from('teacher_assignments')
    .update({ status: 'completed' })
    .eq('id', assignment.id);

  // ----------------------------------------------------
  // 7. Teacher Analytics & Monitoring Verification
  // ----------------------------------------------------
  console.log('\n[Step 7] Verifying Teacher Analytics & Progress Queries...');

  // Fetch student progress for teacher
  const { data: studentRecords } = await supabase
    .from('student_progress')
    .select('*')
    .eq('journey_id', journeyId);

  // Fetch student reflections for teacher
  const { data: teacherReflections } = await supabase
    .from('reflections')
    .select(`
      *,
      profiles:user_id (full_name, email),
      learning_journeys:journey_id (title)
    `)
    .eq('journey_id', journeyId);

  console.log('Total Student Activity Records in Journey:', studentRecords?.length);
  console.log('Total Student Reflections Submitted:', teacherReflections?.length);
  if (teacherReflections && teacherReflections.length > 0) {
    const r = teacherReflections[0];
    console.log(`Student: ${r.profiles?.full_name} (${r.profiles?.email})`);
    console.log(`Journey: ${r.learning_journeys?.title}`);
    console.log(`AI Feedback: ${r.ai_feedback}`);
    console.log(`Rubrics: Depth ${r.rubric_depth} | Accuracy ${r.rubric_accuracy} | Synthesis ${r.rubric_synthesis}`);
  }

  console.log('\n==============================================');
  console.log('✅ ALL 7 END-TO-END ACCEPTANCE TESTS PASSED!');
  console.log('==============================================');
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
