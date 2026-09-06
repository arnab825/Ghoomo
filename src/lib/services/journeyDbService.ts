import { supabase } from '@/lib/supabase/client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: unknown): boolean {
  if (typeof id !== 'string' || !id) return false;
  return UUID_REGEX.test(id);
}

export interface DbLearningObjective {
  id: string;
  journey_id: string;
  objective: string;
  blooms_level: string;
  order_index: number;
}

export interface DbLearningQuestion {
  id: string;
  activity_id: string;
  question: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  order_index: number;
}

export interface DbLearningActivity {
  id: string;
  journey_id: string;
  stage: 'before' | 'during' | 'after';
  type: 'briefing' | 'observation' | 'mission' | 'quiz' | 'reflection' | 'hands_on';
  title: string;
  description: string;
  duration_minutes: number;
  instruction?: string;
  thinking_prompt?: string;
  place_name?: string;
  lat?: number;
  lng?: number;
  order_index: number;
  questions?: DbLearningQuestion[];
}

export interface DbLearningJourney {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  mode: 'digital' | 'explore' | 'travel' | 'field_trip';
  duration_days: number;
  status: 'draft' | 'published' | 'archived';
  cover_image?: string;
  created_at: string;
  updated_at: string;
  objectives?: DbLearningObjective[];
  activities?: DbLearningActivity[];
  assignment_count?: number;
}

export interface DbAssignment {
  id: string;
  journey_id: string;
  teacher_id: string;
  student_id: string;
  due_date?: string;
  status: 'assigned' | 'in_progress' | 'completed';
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  journey?: {
    id: string;
    title: string;
    subject: string;
    grade_level: string;
    cover_image?: string;
  };
}

export interface DbStudentProgress {
  id: string;
  journey_id: string;
  user_id: string;
  activity_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  score: number;
  response?: string;
  evidence_url?: string;
  completed_at: string;
}

export interface DbReflection {
  id: string;
  journey_id: string;
  user_id: string;
  activity_id: string;
  prompt: string;
  response: string;
  ai_feedback?: string;
  rubric_depth: number;
  rubric_accuracy: number;
  rubric_synthesis: number;
  created_at: string;
}

// ============================================================================
// TEACHER WORKFLOW SERVICES
// ============================================================================

/**
 * Fetch all journeys created by a teacher with count of objectives and assignments
 */
export async function getTeacherJourneys(teacherId: string): Promise<DbLearningJourney[]> {
  if (!isValidUuid(teacherId)) {
    return [];
  }

  const { data: journeys, error } = await supabase
    .from('learning_journeys')
    .select(`
      *,
      learning_objectives (id),
      learning_activities (id),
      teacher_assignments (id)
    `)
    .eq('creator_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teacher journeys:', error?.message || error);
    return [];
  }

  return (journeys || []).map((j: any) => ({
    ...j,
    objectives: j.learning_objectives || [],
    activities: j.learning_activities || [],
    assignment_count: (j.teacher_assignments || []).length,
  }));
}

/**
 * Create a complete learning journey in the database
 */
export async function createJourneyInDb(
  teacherId: string,
  journeyData: {
    title: string;
    description: string;
    subject: string;
    grade_level: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    mode: 'digital' | 'explore' | 'travel' | 'field_trip';
    duration_days: number;
    cover_image?: string;
    objectives: Array<{ objective: string; blooms_level: string; order_index: number }>;
    activities: Array<{
      stage: 'before' | 'during' | 'after';
      type: 'briefing' | 'observation' | 'mission' | 'quiz' | 'reflection' | 'hands_on';
      title: string;
      description: string;
      duration_minutes: number;
      instruction?: string;
      thinking_prompt?: string;
      place_name?: string;
      lat?: number;
      lng?: number;
      order_index: number;
      questions?: Array<{
        question: string;
        question_type: string;
        options: string[];
        correct_answer: string;
        explanation?: string;
      }>;
    }>;
  }
): Promise<{ success: boolean; journeyId?: string; error?: string }> {
  try {
    // 1. Insert Journey
    const { data: journey, error: journeyError } = await supabase
      .from('learning_journeys')
      .insert({
        creator_id: teacherId,
        title: journeyData.title,
        description: journeyData.description,
        subject: journeyData.subject,
        grade_level: journeyData.grade_level,
        difficulty: journeyData.difficulty,
        language: journeyData.language || 'English',
        mode: journeyData.mode || 'explore',
        duration_days: journeyData.duration_days || 1,
        cover_image: journeyData.cover_image,
        status: 'published',
      })
      .select('id')
      .single();

    if (journeyError || !journey) {
      return { success: false, error: journeyError?.message || 'Failed to create journey.' };
    }

    const journeyId = journey.id;

    // 2. Insert Objectives
    if (journeyData.objectives && journeyData.objectives.length > 0) {
      const objectivesToInsert = journeyData.objectives.map((obj, idx) => ({
        journey_id: journeyId,
        objective: obj.objective,
        blooms_level: obj.blooms_level || 'understand',
        order_index: obj.order_index ?? idx,
      }));
      await supabase.from('learning_objectives').insert(objectivesToInsert);
    }

    // 3. Insert Activities and Questions
    if (journeyData.activities && journeyData.activities.length > 0) {
      for (let i = 0; i < journeyData.activities.length; i++) {
        const act = journeyData.activities[i];
        const { data: insertedAct } = await supabase
          .from('learning_activities')
          .insert({
            journey_id: journeyId,
            stage: act.stage,
            type: act.type,
            title: act.title,
            description: act.description,
            duration_minutes: act.duration_minutes || 20,
            instruction: act.instruction,
            thinking_prompt: act.thinking_prompt,
            place_name: act.place_name,
            lat: act.lat,
            lng: act.lng,
            order_index: act.order_index ?? i,
          })
          .select('id')
          .single();

        if (insertedAct && act.questions && act.questions.length > 0) {
          const questionsToInsert = act.questions.map((q, qIdx) => ({
            activity_id: insertedAct.id,
            question: q.question,
            question_type: q.question_type || 'mcq',
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            order_index: qIdx,
          }));
          await supabase.from('learning_questions').insert(questionsToInsert);
        }
      }
    }

    return { success: true, journeyId };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error creating journey.' };
  }
}

/**
 * Delete a journey owned by teacher
 */
export async function deleteJourneyInDb(teacherId: string, journeyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('learning_journeys')
    .delete()
    .eq('id', journeyId)
    .eq('creator_id', teacherId);

  return !error;
}

/**
 * Get full journey details (objectives, activities with questions)
 */
export async function getJourneyWithDetails(journeyId: string): Promise<DbLearningJourney | null> {
  const { data: journey, error } = await supabase
    .from('learning_journeys')
    .select(`
      *,
      learning_objectives (*),
      learning_activities (
        *,
        learning_questions (*)
      )
    `)
    .eq('id', journeyId)
    .single();

  if (error || !journey) {
    console.error('Error fetching journey details:', error);
    return null;
  }

  // Sort objectives and activities
  const sortedObjectives = (journey.learning_objectives || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  );
  const sortedActivities = (journey.learning_activities || [])
    .map((act: any) => ({
      ...act,
      questions: (act.learning_questions || []).sort((a: any, b: any) => a.order_index - b.order_index),
    }))
    .sort((a: any, b: any) => a.order_index - b.order_index);

  return {
    ...journey,
    objectives: sortedObjectives,
    activities: sortedActivities,
  };
}

/**
 * Assign a journey to a student by student email or ID
 */
export async function assignJourneyToStudent(
  teacherId: string,
  journeyId: string,
  studentEmailOrId: string,
  dueDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanQuery = studentEmailOrId.trim().toLowerCase();

    // Look up student in profiles
    const { data: student, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .or(`email.eq.${cleanQuery},id.eq.${cleanQuery}`)
      .single();

    if (searchError || !student) {
      return {
        success: false,
        error: `Student not found with email or ID "${studentEmailOrId}". Please make sure the student has registered.`,
      };
    }

    if (student.role !== 'student') {
      return {
        success: false,
        error: `User "${student.full_name}" is registered as a ${student.role}, not a student.`,
      };
    }

    // Insert or update assignment
    const { error: assignError } = await supabase
      .from('teacher_assignments')
      .upsert(
        {
          journey_id: journeyId,
          teacher_id: teacherId,
          student_id: student.id,
          due_date: dueDate || null,
          status: 'assigned',
        },
        { onConflict: 'journey_id,student_id' }
      );

    if (assignError) {
      return { success: false, error: assignError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error assigning journey.' };
  }
}

/**
 * Get all assignments created by a teacher with student details
 */
export async function getTeacherAssignments(teacherId: string): Promise<DbAssignment[]> {
  if (!isValidUuid(teacherId)) {
    return [];
  }

  const { data: assignments, error } = await supabase
    .from('teacher_assignments')
    .select(`
      id,
      journey_id,
      teacher_id,
      student_id,
      due_date,
      status,
      created_at,
      learning_journeys (id, title, subject, grade_level, cover_image)
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teacher assignments:', error?.message || error);
    return [];
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Fetch student profiles separately to avoid PostgREST foreign key cache mismatch
  const studentIds = Array.from(new Set(assignments.map((row: any) => row.student_id).filter(Boolean)));
  const profilesMap = new Map<string, any>();

  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', studentIds);

    if (profiles) {
      profiles.forEach((p: any) => profilesMap.set(p.id, p));
    }
  }

  return assignments.map((row: any) => ({
    id: row.id,
    journey_id: row.journey_id,
    teacher_id: row.teacher_id,
    student_id: row.student_id,
    due_date: row.due_date,
    status: row.status,
    created_at: row.created_at,
    student: profilesMap.get(row.student_id) || {
      id: row.student_id,
      full_name: 'Student',
      email: '',
      avatar_url: '',
    },
    journey: row.learning_journeys,
  }));
}

/**
 * Get list of all registered students for teacher picker
 */
export async function getAllRegisteredStudents(): Promise<Array<{ id: string; full_name: string; email: string }>> {
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name', { ascending: true });

  return data || [];
}

/**
 * Get aggregated stats for the teacher dashboard
 */
export async function getTeacherDashboardStats(teacherId: string): Promise<{
  totalJourneys: number;
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number;
  recentSubmissions: Array<{
    student_name: string;
    journey_title: string;
    score: number;
    completed_at: string;
    response?: string;
  }>;
}> {
  if (!isValidUuid(teacherId)) {
    return {
      totalJourneys: 0,
      totalAssignments: 0,
      completedAssignments: 0,
      completionRate: 0,
      recentSubmissions: [],
    };
  }
  // 1. Total Journeys
  const { count: journeysCount } = await supabase
    .from('learning_journeys')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', teacherId);

  // 2. Total Assignments & Completed
  const { data: assignments } = await supabase
    .from('teacher_assignments')
    .select('id, status')
    .eq('teacher_id', teacherId);

  const totalAssigned = assignments?.length || 0;
  const completed = (assignments || []).filter((a) => a.status === 'completed').length;
  const rate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

  // 3. Recent student activity across teacher's journeys
  const { data: recentProgress } = await supabase
    .from('student_progress')
    .select(`
      user_id,
      score,
      completed_at,
      response,
      learning_journeys!inner (title, creator_id)
    `)
    .eq('learning_journeys.creator_id', teacherId)
    .order('completed_at', { ascending: false })
    .limit(5);

  const progressUserIds = Array.from(new Set((recentProgress || []).map((p: any) => p.user_id).filter(Boolean)));
  const progressProfilesMap = new Map<string, string>();

  if (progressUserIds.length > 0) {
    const { data: progressProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', progressUserIds);

    if (progressProfiles) {
      progressProfiles.forEach((p: any) => progressProfilesMap.set(p.id, p.full_name));
    }
  }

  const recent = (recentProgress || []).map((p: any) => ({
    student_name: progressProfilesMap.get(p.user_id) || 'Student',
    journey_title: p.learning_journeys?.title || 'Journey',
    score: Number(p.score) || 100,
    completed_at: p.completed_at,
    response: p.response,
  }));

  return {
    totalJourneys: journeysCount || 0,
    totalAssignments: totalAssigned,
    completedAssignments: completed,
    completionRate: rate,
    recentSubmissions: recent,
  };
}

// ============================================================================
// STUDENT WORKFLOW SERVICES
// ============================================================================

/**
 * Get all journeys assigned to a student with real completion calculations
 */
export async function getStudentAssignedJourneys(studentId: string): Promise<
  Array<{
    assignmentId: string;
    journey: DbLearningJourney;
    dueDate?: string;
    status: 'assigned' | 'in_progress' | 'completed';
    totalActivities: number;
    completedActivities: number;
    progressPercentage: number;
  }>
> {
  if (!isValidUuid(studentId)) {
    return [];
  }

  // 1. Fetch assignments
  const { data: assignments, error } = await supabase
    .from('teacher_assignments')
    .select(`
      id,
      status,
      due_date,
      learning_journeys (
        *,
        learning_objectives (*),
        learning_activities (id, stage, type, title, description, duration_minutes, order_index)
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error || !assignments) {
    console.error('Error fetching student assigned journeys:', error?.message || error);
    return [];
  }

  // 2. Fetch student's progress records
  const { data: progressList } = await supabase
    .from('student_progress')
    .select('journey_id, activity_id, status')
    .eq('user_id', studentId)
    .eq('status', 'completed');

  const completedMap = new Set((progressList || []).map((p) => `${p.journey_id}:${p.activity_id}`));

  return assignments
    .filter((a: any) => a.learning_journeys)
    .map((a: any) => {
      const j = a.learning_journeys;
      const activities = j.learning_activities || [];
      const total = activities.length;
      const completedCount = activities.filter((act: any) =>
        completedMap.has(`${j.id}:${act.id}`)
      ).length;
      const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      let resolvedStatus: 'assigned' | 'in_progress' | 'completed' = a.status;
      if (percentage >= 100) {
        resolvedStatus = 'completed';
      } else if (percentage > 0) {
        resolvedStatus = 'in_progress';
      }

      return {
        assignmentId: a.id,
        journey: {
          ...j,
          objectives: (j.learning_objectives || []).sort((x: any, y: any) => x.order_index - y.order_index),
          activities: activities.sort((x: any, y: any) => x.order_index - y.order_index),
        },
        dueDate: a.due_date,
        status: resolvedStatus,
        totalActivities: total,
        completedActivities: completedCount,
        progressPercentage: percentage,
      };
    });
}

/**
 * Get student's progress and reflections for a specific journey
 */
export async function getStudentJourneyProgress(
  studentId: string,
  journeyId: string
): Promise<{
  completedActivityIds: string[];
  activityScores: Record<string, number>;
  reflections: Record<string, DbReflection>;
}> {
  // 1. Fetch completed activities
  const { data: progress } = await supabase
    .from('student_progress')
    .select('*')
    .eq('user_id', studentId)
    .eq('journey_id', journeyId);

  const completedIds: string[] = [];
  const scores: Record<string, number> = {};

  (progress || []).forEach((p: any) => {
    if (p.status === 'completed') {
      completedIds.push(p.activity_id);
    }
    if (p.score !== null && p.score !== undefined) {
      scores[p.activity_id] = Number(p.score);
    }
  });

  // 2. Fetch reflections
  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', studentId)
    .eq('journey_id', journeyId);

  const reflectionsMap: Record<string, DbReflection> = {};
  (reflections || []).forEach((r: any) => {
    reflectionsMap[r.activity_id] = r;
  });

  return {
    completedActivityIds: completedIds,
    activityScores: scores,
    reflections: reflectionsMap,
  };
}

/**
 * Mark an activity as completed by a student
 */
export async function submitActivityCompletion(
  studentId: string,
  journeyId: string,
  activityId: string,
  data?: { score?: number; response?: string; evidenceUrl?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('student_progress')
    .upsert(
      {
        journey_id: journeyId,
        user_id: studentId,
        activity_id: activityId,
        status: 'completed',
        score: data?.score ?? 100,
        response: data?.response || null,
        evidence_url: data?.evidenceUrl || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,activity_id' }
    );

  if (error) {
    console.error('Error saving activity progress:', error);
    return false;
  }

  // Check if all activities are completed to update assignment status
  checkAndUpdateAssignmentStatus(studentId, journeyId);

  return true;
}

/**
 * Save or update a student's reflection with AI feedback
 */
export async function saveStudentReflection(
  studentId: string,
  journeyId: string,
  activityId: string,
  prompt: string,
  response: string,
  aiFeedback?: string,
  rubrics?: { depth: number; accuracy: number; synthesis: number }
): Promise<boolean> {
  // 1. Save in reflections table
  const { error: refError } = await supabase
    .from('reflections')
    .upsert(
      {
        journey_id: journeyId,
        user_id: studentId,
        activity_id: activityId,
        prompt,
        response,
        ai_feedback: aiFeedback || null,
        rubric_depth: rubrics?.depth ?? 4,
        rubric_accuracy: rubrics?.accuracy ?? 4,
        rubric_synthesis: rubrics?.synthesis ?? 4,
      },
      { onConflict: 'user_id,activity_id' }
    );

  if (refError) {
    console.error('Error saving reflection:', refError);
    return false;
  }

  // 2. Mark the reflection activity as completed in progress table
  await submitActivityCompletion(studentId, journeyId, activityId, {
    score: 100,
    response,
  });

  return true;
}

/**
 * Helper: Updates assignment status to 'in_progress' or 'completed'
 */
async function checkAndUpdateAssignmentStatus(studentId: string, journeyId: string) {
  try {
    const { data: activities } = await supabase
      .from('learning_activities')
      .select('id')
      .eq('journey_id', journeyId);

    const totalActivities = activities?.length || 0;
    if (totalActivities === 0) return;

    const { count: completedCount } = await supabase
      .from('student_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', studentId)
      .eq('journey_id', journeyId)
      .eq('status', 'completed');

    let newStatus = 'in_progress';
    if (completedCount && completedCount >= totalActivities) {
      newStatus = 'completed';
    }

    await supabase
      .from('teacher_assignments')
      .update({ status: newStatus })
      .eq('student_id', studentId)
      .eq('journey_id', journeyId);
  } catch (err) {
    console.warn('Assignment status update error:', err);
  }
}

/**
 * Get aggregated stats for student dashboard
 */
export async function getStudentDashboardStats(studentId: string): Promise<{
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  overallMastery: number;
  recentActivities: Array<{
    journey_title: string;
    score: number;
    completed_at: string;
  }>;
}> {
  const journeys = await getStudentAssignedJourneys(studentId);

  const assigned = journeys.length;
  const inProgress = journeys.filter((j) => j.status === 'in_progress').length;
  const completed = journeys.filter((j) => j.status === 'completed').length;

  // Average quiz score across progress
  const { data: progressRecords } = await supabase
    .from('student_progress')
    .select(`
      score,
      completed_at,
      learning_journeys (title)
    `)
    .eq('user_id', studentId)
    .order('completed_at', { ascending: false });

  let totalScore = 0;
  let scoreCount = 0;
  const recent: any[] = [];

  (progressRecords || []).forEach((p: any) => {
    if (p.score !== null && p.score !== undefined) {
      totalScore += Number(p.score);
      scoreCount++;
    }
    if (recent.length < 5) {
      recent.push({
        journey_title: p.learning_journeys?.title || 'Learning Activity',
        score: Number(p.score) || 100,
        completed_at: p.completed_at,
      });
    }
  });

  const mastery = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  return {
    assignedCount: assigned,
    inProgressCount: inProgress,
    completedCount: completed,
    overallMastery: mastery,
    recentActivities: recent,
  };
}
