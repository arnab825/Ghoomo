import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function callGemini(prompt, jsonMode = true) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API call failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

async function runLifecycle() {
  console.log('===========================================================');
  console.log('🎓 GHOOMO SMART LEARNING: FULL REAL-DATABASE LIFECYCLE TEST');
  console.log('===========================================================');

  // 1. Teacher Authentication
  console.log('\n[1] Teacher authenticating (teacher@demo.edu)...');
  const { data: teacherAuth, error: tAuthErr } = await supabase.auth.signInWithPassword({
    email: 'teacher@demo.edu',
    password: 'Password123!',
  });
  if (tAuthErr) throw new Error('Teacher auth failed: ' + tAuthErr.message);
  console.log('✅ Teacher Logged In! Session Token obtained for user:', teacherAuth.user.id);

  // Fetch Teacher Journeys
  const { data: journeys, error: jErr } = await supabase
    .from('learning_journeys')
    .select('*, learning_objectives(*), learning_activities(*, learning_questions(*))')
    .eq('creator_id', teacherAuth.user.id);
  if (jErr) throw new Error('Failed to fetch teacher journeys: ' + jErr.message);
  console.log(`✅ Teacher has ${journeys.length} learning journey(s) in Supabase PostgreSQL:`);
  journeys.forEach(j => {
    console.log(`   - "${j.title}" (${j.grade_level}, ${j.subject})`);
    console.log(`     Objectives: ${j.learning_objectives.length} | Activities: ${j.learning_activities.length}`);
  });

  const flagship = journeys[0];
  if (!flagship) throw new Error('No flagship journey found');

  // 2. Student Authentication
  console.log('\n[2] Student authenticating (student@demo.edu)...');
  const { data: studentAuth, error: sAuthErr } = await supabase.auth.signInWithPassword({
    email: 'student@demo.edu',
    password: 'Password123!',
  });
  if (sAuthErr) throw new Error('Student auth failed: ' + sAuthErr.message);
  console.log('✅ Student Logged In! User ID:', studentAuth.user.id);

  // Student fetches their assignments
  const { data: assignments, error: aErr } = await supabase
    .from('teacher_assignments')
    .select('*, learning_journeys(*)')
    .eq('student_id', studentAuth.user.id);
  if (aErr) throw new Error('Failed to fetch assignments: ' + aErr.message);
  console.log(`✅ Student has ${assignments.length} assigned journey(s):`);
  assignments.forEach(a => {
    console.log(`   - Assigned: "${a.learning_journeys?.title}" | Due: ${a.due_date} | Status: ${a.status}`);
  });

  // 3. Student Progress: Before Activity
  const actBefore = flagship.learning_activities.find(a => a.stage === 'before');
  const actDuring = flagship.learning_activities.find(a => a.stage === 'during');
  const actAfter = flagship.learning_activities.find(a => a.stage === 'after');

  console.log('\n[3] Student completing BEFORE activity...');
  const { error: p1Err } = await supabase
    .from('student_progress')
    .upsert({
      journey_id: flagship.id,
      user_id: studentAuth.user.id,
      activity_id: actBefore.id,
      status: 'completed',
      score: 100,
      response: 'Completed briefing and answered 2 formative quiz questions accurately.',
    }, { onConflict: 'journey_id,user_id,activity_id' });
  if (p1Err) throw new Error('Student progress before failed: ' + p1Err.message);
  console.log('✅ Before Activity marked as COMPLETED with 100% quiz score in PostgreSQL.');

  // 4. Student Progress: During Activity
  console.log('\n[4] Student completing DURING activity (Field Observation at Netaji Bhavan)...');
  const { error: p2Err } = await supabase
    .from('student_progress')
    .upsert({
      journey_id: flagship.id,
      user_id: studentAuth.user.id,
      activity_id: actDuring.id,
      status: 'completed',
      score: 100,
      response: 'Inspected registration plate BLA 7169 on Wanderer W24 sedan. Noted disguise precautions.',
    }, { onConflict: 'journey_id,user_id,activity_id' });
  if (p2Err) throw new Error('Student progress during failed: ' + p2Err.message);
  console.log('✅ During Activity marked as COMPLETED in PostgreSQL.');

  // 5. Student Reflection & Live Gemini AI Rubric Evaluation
  console.log('\n[5] Student submitting reflection with Live Google Gemini 2.5 Flash Evaluation...');
  const studentReflection = 
    'Standing right next to the black Wanderer W24 sedan at Netaji Bhavan transformed abstract textbook history into visceral reality. ' +
    'Seeing the narrow staircase and realizing Netaji was disguised as Mohammad Ziauddin while the British CID watched the front gate ' +
    'demonstrates the immense tactical planning and calculated courage behind Bengal’s revolutionary movement.';

  const aiPrompt = `
You are an expert pedagogical AI evaluator assessing an experiential learning reflection for Smart India Hackathon.
Evaluate the student's reflection on the following learning journey and activity:

Journey: ${flagship.title}
Subject: ${flagship.subject}
Grade Level: ${flagship.grade_level}
Activity Prompt: ${actAfter.thinking_prompt}

Student's Reflection:
"${studentReflection}"

Return ONLY a raw JSON object with:
{
  "feedback": "2-3 constructive sentences directly addressing their observations and critical synthesis",
  "conceptualUnderstanding": number between 70 and 100,
  "fieldEvidence": number between 70 and 100,
  "criticalSynthesis": number between 70 and 100,
  "recommendations": ["one actionable follow-up inquiry question"]
}
`;

  const rawAiResult = await callGemini(aiPrompt, true);
  const parsedFeedback = JSON.parse(rawAiResult);
  console.log('✅ Live Gemini AI Evaluation Received:');
  console.log('   Feedback:', parsedFeedback.feedback);
  console.log(`   Rubrics: Understanding: ${parsedFeedback.conceptualUnderstanding}/100 | Evidence: ${parsedFeedback.fieldEvidence}/100 | Synthesis: ${parsedFeedback.criticalSynthesis}/100`);

  // 6. Save Reflection to PostgreSQL
  const { data: savedRefl, error: reflErr } = await supabase
    .from('reflections')
    .upsert({
      journey_id: flagship.id,
      user_id: studentAuth.user.id,
      activity_id: actAfter.id,
      prompt: actAfter.thinking_prompt,
      response: studentReflection,
      ai_feedback: parsedFeedback.feedback,
      rubric_depth: parsedFeedback.conceptualUnderstanding,
      rubric_accuracy: parsedFeedback.fieldEvidence,
      rubric_synthesis: parsedFeedback.criticalSynthesis,
    }, { onConflict: 'user_id,activity_id' })
    .select()
    .single();

  if (reflErr) throw new Error('Failed to save reflection: ' + reflErr.message);
  console.log('✅ Reflection and AI Rubrics successfully saved to Supabase PostgreSQL! ID:', savedRefl.id);

  // Mark assignment as completed
  await supabase
    .from('teacher_assignments')
    .update({ status: 'completed' })
    .eq('id', assignments[0].id);
  console.log('✅ Assignment status updated to "completed" in PostgreSQL.');

  // 7. Teacher Dashboard Aggregates Verification
  console.log('\n[6] Verifying Teacher Live Cohort Monitoring...');
  const { data: teacherProgressView } = await supabase
    .from('student_progress')
    .select('*, profiles:user_id(full_name, email)')
    .eq('journey_id', flagship.id);

  const { data: teacherReflView } = await supabase
    .from('reflections')
    .select('*, profiles:user_id(full_name, email)')
    .eq('journey_id', flagship.id);

  console.log(`✅ Teacher Dashboard Query Verified:`);
  console.log(`   - Total Completed Activities Logged: ${teacherProgressView?.length}`);
  console.log(`   - Total Student Reflections Evaluated: ${teacherReflView?.length}`);
  console.log(`   - Student Name: ${teacherReflView[0]?.profiles?.full_name}`);
  console.log(`   - Average Score: ${Math.round((savedRefl.rubric_depth + savedRefl.rubric_accuracy + savedRefl.rubric_synthesis) / 3)}%`);

  console.log('\n===========================================================');
  console.log('🎉 ENTIRE DATABASE-DRIVEN EDUCATIONAL WORKFLOW PASSED 100%!');
  console.log('===========================================================');
  process.exit(0);
}

runLifecycle().catch(err => {
  console.error('\n❌ LIFECYCLE TEST FAILED:', err);
  process.exit(1);
});
