"use client";

import React from "react";
import {
  Users,
  Award,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { LearningJourney } from "@/lib/types/learning";
import { Button } from "@/components/ui/button";

interface TeacherDashboardProps {
  journey: LearningJourney;
  onOpenReport: () => void;
}

export default function TeacherDashboard({ journey, onOpenReport }: TeacherDashboardProps) {
  const analytics = journey.analytics || {
    totalLearners: 32,
    completionRate: 78,
    averageQuizMastery: 84,
    activitiesCompletedCount: 94,
    reflectionsSubmittedCount: 28,
    commonMisconceptions: [
      "Students frequently confuse Lord Curzon with Lord Dalhousie.",
      "Many initially thought Makrana marble was imported from Italy rather than Rajasthan.",
    ],
  };

  const sampleStudents = [
    { id: "s-1", name: "Aarav Patel", progress: 88, score: "3/3", status: "Active in Field", avatar: "AP" },
    { id: "s-2", name: "Rohan Sen", progress: 65, score: "2/3", status: "Reviewing Victoria Memorial", avatar: "RS" },
    { id: "s-3", name: "Ananya Mukherjee", progress: 100, score: "3/3", status: "Submitted Reflection", avatar: "AM" },
    { id: "s-4", name: "Kabir Das", progress: 45, score: "1/3", status: "Pre-briefing Stage", avatar: "KD" },
    { id: "s-5", name: "Sneha Roy", progress: 92, score: "3/3", status: "Netaji Bhawan Mission", avatar: "SR" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Teacher Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} />
            <span>Classroom Orchestration • Grade: {journey.gradeLevel}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
            Educator & Curriculum Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time tracking of student observations, in-situ quiz checkpoints, and reflection submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onOpenReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Printer size={13} />
            <span>Export Class Report</span>
          </Button>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Enrolled Squad</span>
            <Users size={14} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {analytics.totalLearners}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">92% active today</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Completion Rate</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {analytics.completionRate}%
          </div>
          <div className="text-[11px] text-slate-400">Target: 75% for Class 8</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Quiz Mastery</span>
            <Award size={14} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            {analytics.averageQuizMastery}%
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">+14% vs. paper quizzes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Reflections</span>
            <FileText size={14} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {analytics.reflectionsSubmittedCount}
          </div>
          <div className="text-[11px] text-slate-400">All evaluated by AI</div>
        </div>
      </div>

      {/* AI Pedagogical Insights */}
      {analytics.commonMisconceptions && analytics.commonMisconceptions.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
            <AlertCircle size={15} />
            <span>AI Diagnosed Misconceptions from Student Quiz Answers</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-400 space-y-1 pl-1">
            {analytics.commonMisconceptions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Student Progress & Live Field Status
          </h3>
          <span className="text-xs text-slate-500 font-mono">Class 8B • 32 Students</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {sampleStudents.map((student) => (
            <div key={student.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {student.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                  <div className="text-[11px] text-slate-400">{student.status}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block w-28 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Progress</span>
                    <span className="font-mono">{student.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900 dark:text-white">{student.score}</div>
                  <div className="text-[10px] text-slate-400">Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
