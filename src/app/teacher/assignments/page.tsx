'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  Mail,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTeacherJourneys,
  getTeacherAssignments,
  getAllRegisteredStudents,
  assignJourneyToStudent,
  DbLearningJourney,
  DbAssignment,
} from '@/lib/services/journeyDbService';

function AssignmentsManager() {
  const searchParams = useSearchParams();
  const preselectedJourneyId = searchParams.get('journeyId') || '';

  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });

  const [journeys, setJourneys] = useState<DbLearningJourney[]>([]);
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; email: string }>>([]);

  const [selectedJourneyId, setSelectedJourneyId] = useState(preselectedJourneyId);
  const [studentInput, setStudentInput] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const [teacherJourneys, teacherAssignments, registeredStudents] = await Promise.all([
          getTeacherJourneys(user!.id),
          getTeacherAssignments(user!.id),
          getAllRegisteredStudents(),
        ]);

        if (isMounted) {
          setJourneys(teacherJourneys);
          setAssignments(teacherAssignments);
          setStudents(registeredStudents);
          if (!selectedJourneyId && teacherJourneys.length > 0) {
            setSelectedJourneyId(teacherJourneys[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load assignments data:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    if (!selectedJourneyId) {
      setFeedback({ type: 'error', message: 'Please select a learning journey.' });
      return;
    }

    if (!studentInput.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a student email or select a registered student.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await assignJourneyToStudent(
        user.id,
        selectedJourneyId,
        studentInput.trim(),
        dueDate ? new Date(dueDate).toISOString() : undefined
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Failed to assign journey.' });
        return;
      }

      setFeedback({ type: 'success', message: 'Journey successfully assigned to student!' });
      setStudentInput('');
      setDueDate('');

      // Refresh assignments list
      const refreshed = await getTeacherAssignments(user.id);
      setAssignments(refreshed);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error assigning journey.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 mb-2">
            <span>Classroom Assignments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Manage Student Assignments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Assign your learning journeys to students and monitor their completion status.
          </p>
        </div>

        <Link href="/teacher/journeys/create">
          <Button variant="outline" className="text-xs font-semibold py-2 px-3.5 rounded-xl cursor-pointer">
            <Plus size={14} className="mr-1" />
            <span>Create New Journey</span>
          </Button>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Assignment Creator Form Card */}
      <div className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Assign Journey to Student
        </h3>

        {journeys.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-2">
            <p>You haven&apos;t created any learning journeys yet.</p>
            <Link href="/teacher/journeys/create">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl">
                Create a Journey First
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
            <div className="space-y-1 sm:col-span-1 lg:col-span-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Journey
              </label>
              <select
                value={selectedJourneyId}
                onChange={(e) => setSelectedJourneyId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white"
              >
                {journeys.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-1 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Student Email or Registered Student
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder="student@school.edu"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {students.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setStudentInput(e.target.value);
                    }}
                    className="w-36 px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <option value="">Choose...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.email}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-1 lg:col-span-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} />
                    <span>Assign to Student</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Active Assignments Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Current Assignments ({assignments.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students and their active learning journey progress
            </p>
          </div>
        </div>

        {isDataLoading ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading assignments from database...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Users size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No assignments yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Use the form above to assign a journey to one of your students. When the student logs in, it will appear directly on their dashboard.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Journey</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Assigned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {row.student?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {row.student?.full_name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400">{row.student?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {row.journey?.title || 'Learning Journey'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {row.journey?.subject} • {row.journey?.grade_level}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : row.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading assignments...</div>}>
      <AssignmentsManager />
    </Suspense>
  );
}
