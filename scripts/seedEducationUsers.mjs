import postgres from 'postgres';

const sql = postgres({
  host: 'db.todsjfjgyzaeiwimkwtq.supabase.co',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '@RmS69^m2crE?pN',
  ssl: 'require',
  connect_timeout: 15,
});

async function seed() {
  console.log('--- Seeding Verified Teacher & Student Accounts in Supabase DB ---');

  const usersToCreate = [
    {
      id: 'd1111111-1111-4111-8111-111111111111',
      email: 'teacher@demo.edu',
      name: 'Prof. Ananya Sen',
      role: 'teacher',
      raw_meta: { full_name: 'Prof. Ananya Sen', role: 'teacher' },
    },
    {
      id: 'd2222222-2222-4222-8222-222222222222',
      email: 'student@demo.edu',
      name: 'Rohit Mukherjee',
      role: 'student',
      raw_meta: { full_name: 'Rohit Mukherjee', role: 'student' },
    },
    {
      id: 'd3333333-3333-4333-8333-333333333333',
      email: 'priya.student@demo.edu',
      name: 'Priya Sharma',
      role: 'student',
      raw_meta: { full_name: 'Priya Sharma', role: 'student' },
    },
  ];

  for (const u of usersToCreate) {
    console.log(`Setting up user: ${u.email} [${u.role}]...`);

    // 1. Insert or update in auth.users with pre-hashed bcrypt password and confirmed email
    await sql`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${u.id},
        'authenticated',
        'authenticated',
        ${u.email},
        crypt('Password123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        ${sql.json(u.raw_meta)},
        now(),
        now(),
        '',
        ''
      )
      ON CONFLICT (id) DO UPDATE SET
        email = ${u.email},
        encrypted_password = crypt('Password123!', gen_salt('bf')),
        email_confirmed_at = now(),
        raw_user_meta_data = ${sql.json(u.raw_meta)},
        updated_at = now();
    `;

    // 1b. Upsert in auth.identities (email is a generated column in Supabase)
    await sql`
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at
      )
      VALUES (
        ${u.id},
        ${u.id},
        ${sql.json({ sub: u.id, email: u.email })},
        'email',
        ${u.email},
        now(),
        now()
      )
      ON CONFLICT (provider, provider_id) DO UPDATE SET
        identity_data = ${sql.json({ sub: u.id, email: u.email })},
        updated_at = now();
    `;

    // 2. Upsert in public.profiles
    await sql`
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        credits,
        created_at,
        updated_at
      )
      VALUES (
        ${u.id},
        ${u.email},
        ${u.name},
        ${u.role},
        9,
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = ${u.email},
        full_name = ${u.name},
        role = ${u.role},
        updated_at = now();
    `;
    console.log(`✅ User ${u.email} active with role "${u.role}"`);
  }

  // 3. Seed Flagship Learning Journey created by Teacher
  console.log('\n--- Seeding Flagship Journey: Kolkata Freedom Trail ---');
  const journeyId = 'f4444444-4444-4444-8444-444444444444';
  const teacherId = 'd1111111-1111-4111-8111-111111111111';
  const studentId = 'd2222222-2222-4222-8222-222222222222';

  await sql`
    INSERT INTO public.learning_journeys (
      id,
      creator_id,
      title,
      description,
      subject,
      grade_level,
      difficulty,
      language,
      mode,
      duration_days,
      status,
      cover_image,
      created_at,
      updated_at
    )
    VALUES (
      ${journeyId},
      ${teacherId},
      'Indian Freedom Movement: Kolkata Trail',
      'An experiential inquiry examining the revolutionary resistance in Bengal, Netaji Subhas Chandra Bose’s Great Escape, and primary documentary evidence across Kolkata’s heritage quarters.',
      'History & Social Studies',
      'Class 8',
      'intermediate',
      'English',
      'explore',
      1,
      'published',
      'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description;
  `;

  // 4. Learning Objectives
  await sql`
    DELETE FROM public.learning_objectives WHERE journey_id = ${journeyId};
  `;
  await sql`
    INSERT INTO public.learning_objectives (journey_id, objective, blooms_level, order_index)
    VALUES
      (${journeyId}, 'Identify the strategic logistical conditions behind Netaji Bose’s 1941 Great Escape from British surveillance.', 'understand', 0),
      (${journeyId}, 'Analyze colonial surveillance methods and the revolutionary network in central Calcutta.', 'analyze', 1),
      (${journeyId}, 'Synthesize how preservation of physical historical artifacts impacts civic understanding today.', 'evaluate', 2);
  `;

  // 5. Activities (Before -> During -> After)
  await sql`
    DELETE FROM public.learning_activities WHERE journey_id = ${journeyId};
  `;

  const actBeforeId = 'b1111111-1111-4111-8111-111111111111';
  const actDuringId = 'b2222222-2222-4222-8222-222222222222';
  const actAfterId = 'b3333333-3333-4333-8333-333333333333';

  await sql`
    INSERT INTO public.learning_activities (
      id, journey_id, stage, type, title, description, duration_minutes,
      instruction, thinking_prompt, place_name, lat, lng, order_index
    )
    VALUES
      (
        ${actBeforeId},
        ${journeyId},
        'before',
        'briefing',
        'Pre-Visit Briefing: 1941 Surveillance & The Secret Plan',
        'Orientation briefing on the house arrest of Subhas Chandra Bose and the disguise as Ziauddin.',
        15,
        'Study the house layout map of Elgin Road and note the guard deployment positions.',
        'Why was the Great Escape considered a psychological turning point in the Bengal revolutionary movement?',
        NULL,
        NULL,
        NULL,
        0
      ),
      (
        ${actDuringId},
        ${journeyId},
        'during',
        'observation',
        'Field Observation: The Wanderer W24 & Secret Staircase',
        'On-site field mission at Netaji Bhavan examining the escape car and personal belongings.',
        35,
        'Locate registration plate BLA 7169 on the black Wanderer W24 sedan. Photograph or sketch the vantage point.',
        'How did mechanical reliability and vehicle selection factor into avoiding police checkpoints at Barakar?',
        'Netaji Bhavan, 38/2 Lala Lajpat Rai Sarani, Kolkata',
        22.5358,
        88.3541,
        1
      ),
      (
        ${actAfterId},
        ${journeyId},
        'after',
        'reflection',
        'Post-Visit Reflection & Critical Synthesis',
        'Structured synthesis connecting physical observation to modern civic courage and historiography.',
        25,
        'Compose a 150-word synthesis answering the reflection prompt using evidence collected on site.',
        'In what ways does encountering the physical vehicle and preserved staircase expand your historical empathy beyond reading textbook paragraphs?',
        NULL,
        NULL,
        NULL,
        2
      );
  `;

  // Quiz Questions for Before Activity
  await sql`
    INSERT INTO public.learning_questions (
      activity_id, question, question_type, options, correct_answer, explanation, order_index
    )
    VALUES
      (
        ${actBeforeId},
        'What disguise did Netaji Subhas Chandra Bose adopt for his escape from Elgin Road in January 1941?',
        'mcq',
        ${['An Italian diplomat', 'An insurance agent named Ziauddin', 'A postal inspector', 'A railway surveyor']},
        'An insurance agent named Ziauddin',
        'Netaji disguised himself as Mohammad Ziauddin, Traveling Inspector of The Empire of India Life Insurance Company.',
        0
      ),
      (
        ${actBeforeId},
        'Who drove Netaji out of the Elgin Road house on the night of January 16-17, 1941?',
        'mcq',
        ${['Sisir Kumar Bose (his nephew)', 'Sarat Chandra Bose', 'Rash Behari Bose', 'Bipin Chandra Pal']},
        'Sisir Kumar Bose (his nephew)',
        'Sisir Kumar Bose, Netaji’s nephew, drove the Wanderer car out through the main gate in the dark.',
        1
      );
  `;

  // 6. Teacher Assignment to Student
  const assignmentId = 'a1111111-1111-4111-8111-111111111111';
  await sql`
    INSERT INTO public.teacher_assignments (
      id, journey_id, teacher_id, student_id, due_date, status, created_at
    )
    VALUES (
      ${assignmentId},
      ${journeyId},
      ${teacherId},
      ${studentId},
      CURRENT_DATE + INTERVAL '7 days',
      'assigned',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      status = 'assigned',
      due_date = CURRENT_DATE + INTERVAL '7 days';
  `;

  console.log('✅ Flagship Journey, Activities, Quizzes, and Assignment seeded successfully!');
  console.log('\n-----------------------------------------------------------');
  console.log('CREDENTIALS READY FOR TESTING:');
  console.log('Teacher:  teacher@demo.edu        / Password123!');
  console.log('Student:  student@demo.edu        / Password123!');
  console.log('Student2: priya.student@demo.edu  / Password123!');
  console.log('-----------------------------------------------------------');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
