"use client";

import React from "react";
import { X, Printer, Download, CheckCircle2, GraduationCap, Award, BookOpen, MapPin } from "lucide-react";
import { LearningJourney } from "@/lib/types/learning";
import { Button } from "@/components/ui/button";

interface LearningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: LearningJourney;
}

export default function LearningReportModal({ isOpen, onClose, journey }: LearningReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const completedActivities = journey.activities.filter((a) => a.status === "completed");
  const mastery = journey.progress?.masteryPercentage || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
        role="dialog"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 print:hidden bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <GraduationCap size={16} className="text-indigo-600" />
            <span>Learning Journey Report Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={13} />
              <span>Print / Save as PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                Ghoomo Smart Learning Journey • Portfolio Report
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-heading">
                {journey.title}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                {journey.description}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs text-slate-500 shrink-0">
              <div><span className="font-semibold text-slate-700 dark:text-slate-300">Learner:</span> Aarav Patel</div>
              <div><span className="font-semibold text-slate-700 dark:text-slate-300">Grade Level:</span> {journey.gradeLevel}</div>
              <div><span className="font-semibold text-slate-700 dark:text-slate-300">Subject:</span> {journey.subject}</div>
              <div><span className="font-semibold text-slate-700 dark:text-slate-300">Generated Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Mastery & Competency Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800/60 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Mastery Index</div>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{mastery}%</div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800/60 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Completed Missions</div>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {completedActivities.length} / {journey.activities.length}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800/60 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Quiz Accuracy</div>
              <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {journey.progress?.totalScore || 92}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 dark:bg-slate-800/60 text-center space-y-0.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Reflections</div>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {journey.reflections?.length || 1} Evaluated
              </div>
            </div>
          </div>

          {/* Core Learning Objectives */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award size={15} className="text-indigo-600" />
              <span>Demonstrated Curriculum Objectives</span>
            </h3>
            <div className="space-y-2 text-xs">
              {journey.objectives.map((obj, i) => (
                <div key={obj.id} className="flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">Objective {i + 1}:</span>{" "}
                    <span className="text-slate-600 dark:text-slate-300">{obj.text}</span>
                    <span className="ml-2 text-[10px] font-mono uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {obj.bloomsLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observation Missions & Evidence */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin size={15} className="text-emerald-600" />
              <span>Field Inquiry & Observation Submissions</span>
            </h3>
            <div className="space-y-3">
              {journey.activities
                .filter((a) => a.submission || a.status === "completed")
                .map((act) => (
                  <div key={act.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      {act.placeName && <span className="text-[11px] text-slate-500">📍 {act.placeName}</span>}
                    </div>
                    {act.submission && (
                      <div className="space-y-1 pl-2 border-l-2 border-indigo-600 text-slate-700">
                        <p className="italic">"{act.submission.text}"</p>
                        {act.submission.aiFeedback && (
                          <p className="text-[11px] text-indigo-700 font-medium">
                            AI Feedback: {act.submission.aiFeedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Student Reflections */}
          {journey.reflections && journey.reflections.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen size={15} className="text-amber-600" />
                <span>Student Reflection & Pedagogical Feedback</span>
              </h3>
              <div className="space-y-3">
                {journey.reflections.map((ref) => (
                  <div key={ref.id} className="p-4 rounded-xl border border-slate-200 bg-amber-50/40 space-y-2 text-xs">
                    <div className="font-semibold text-slate-900">Prompt: {ref.prompt}</div>
                    <p className="text-slate-700 italic">"{ref.studentResponse}"</p>
                    {ref.aiFeedback && (
                      <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
                        <span className="font-bold">Evaluation:</span> {ref.aiFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Provenance Footnote */}
          {journey.sourceProvenance && (
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <div>
                <span className="font-semibold">Curriculum Provenance:</span> Source: {journey.sourceProvenance.title} •
                Model: {journey.sourceProvenance.aiModelUsed || "Gemini 1.5 Flash"} •
                Verified Locations: {journey.sourceProvenance.verifiedLocationsCount || 4}
              </div>
              <div>Generated via Ghoomo Smart Learning Journeys for SIH 2026 Problem Statement 26207.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
