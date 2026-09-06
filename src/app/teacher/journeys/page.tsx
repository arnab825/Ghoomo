'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Users,
  Eye,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getTeacherJourneys,
  deleteJourneyInDb,
  DbLearningJourney,
} from '@/lib/services/journeyDbService';

export default function TeacherJourneysPage() {
  const { user, isLoading: authLoading, isAuthorized } = useAuthGuard({ requiredRole: 'teacher' });

  const [journeys, setJourneys] = useState<DbLearningJourney[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadJourneys() {
      setIsDataLoading(true);
      try {
        const data = await getTeacherJourneys(user!.id);
        if (isMounted) setJourneys(data);
      } catch (err) {
        console.error('Failed to load journeys:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    loadJourneys();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDelete = async (journeyId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this journey? This will also remove associated student progress.')) {
      return;
    }

    setDeletingId(journeyId);
    const ok = await deleteJourneyInDb(user.id, journeyId);
    if (ok) {
      setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
    } else {
      alert('Failed to delete journey. Please try again.');
    }
    setDeletingId(null);
  };

  const filteredJourneys = journeys.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || j.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(journeys.map((j) => j.subject))).filter(Boolean);

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
            <span>Curriculum Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            My Learning Journeys
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All experiential learning journeys you have built for your classes.
          </p>
        </div>

        <Link href="/teacher/journeys/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer">
            <Plus size={15} />
            <span>Create New Journey</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedSubject === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                  selectedSubject.toLowerCase() === sub.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Journey Grid */}
      {isDataLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Loader2 size={28} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading your journeys...</p>
        </div>
      ) : filteredJourneys.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <BookOpen size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching journeys found' : 'No learning journeys yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search keywords or clear the filter.'
                : 'Get started by creating your first experiential learning journey for your students.'}
            </p>
          </div>
          {!searchQuery && (
            <Link href="/teacher/journeys/create" className="inline-block pt-1">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl">
                <Plus size={14} className="mr-1" />
                <span>Create Journey</span>
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJourneys.map((journey) => (
            <div
              key={journey.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow"
            >
              {journey.cover_image && (
                <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={journey.cover_image}
                    alt={journey.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 backdrop-blur-xs">
                    {journey.duration_days} Day{journey.duration_days > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {journey.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {journey.grade_level}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                      {journey.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                    {journey.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {journey.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {(journey.activities || []).length} activities • {journey.assignment_count || 0} assigned
                  </span>

                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/assignments?journeyId=${journey.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] font-semibold py-1 px-2.5 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                      >
                        <Users size={12} className="mr-1" />
                        <span>Assign</span>
                      </Button>
                    </Link>

                    <Link href={`/teacher/journeys/${journey.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] font-semibold py-1 px-2.5 rounded-lg"
                      >
                        <Eye size={12} className="mr-1" />
                        <span>View</span>
                      </Button>
                    </Link>

                    <button
                      onClick={() => handleDelete(journey.id)}
                      disabled={deletingId === journey.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete journey"
                    >
                      {deletingId === journey.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
