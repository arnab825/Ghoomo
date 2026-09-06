'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  BookOpen,
  Search,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStudentAssignedJourneys } from '@/lib/services/journeyDbService';

export default function StudentJourneysPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'student' });

  const [assignedJourneys, setAssignedJourneys] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function load() {
      setIsDataLoading(true);
      try {
        const journeys = await getStudentAssignedJourneys(user!.id);
        if (isMounted) setAssignedJourneys(journeys);
      } catch (err) {
        console.error('Failed to load assigned journeys:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const filtered = assignedJourneys.filter((item) => {
    const j = item.journey;
    return (
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 mb-2">
            <span>My Curriculum</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            My Learning Journeys
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All curriculum modules assigned to you by your teachers.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journeys..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isDataLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 size={28} className="animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading your journeys...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <BookOpen size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching journeys found' : 'No assigned journeys'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search terms.'
              : 'Your assigned journeys will appear here once your teacher adds you.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const j = item.journey;
            return (
              <div
                key={item.assignmentId}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                {j.cover_image && (
                  <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    <img
                      src={j.cover_image}
                      alt={j.title}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-xs ${
                        item.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : item.status === 'in_progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/90 text-slate-700 dark:bg-slate-900/90 dark:text-slate-200'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {j.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {j.grade_level}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                        {j.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {j.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {j.description}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {item.completedActivities} of {item.totalActivities} activities
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${item.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href={`/student/journeys/${j.id}`} className="block">
                      <Button
                        className={`w-full text-xs font-semibold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                          item.status === 'completed'
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <Play size={13} />
                        <span>
                          {item.status === 'completed'
                            ? 'Review Journey'
                            : item.status === 'in_progress'
                            ? 'Continue Mission'
                            : 'Begin Journey'}
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
