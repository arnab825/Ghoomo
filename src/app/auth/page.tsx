"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Sparkles,
  Mail,
  Lock,
} from "lucide-react";
import { useAuthStore, DEMO_PERSONAS } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const router = useRouter();
  const { currentUser, switchPersona, login, isAuthenticated } = useAuthStore();
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsSubmitting(true);
    setTimeout(() => {
      login(emailInput);
      setIsSubmitting(false);
      router.push("/trips");
    }, 400);
  };

  const handlePersonaSelect = (id: string) => {
    switchPersona(id);
    router.push("/trips");
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md mb-1">
            <Compass size={28} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
            Welcome to <span className="text-teal-600">Ghoomo</span>
          </h1>
          <p className="text-xs text-slate-400">
            Social-to-itinerary travel studio for discovering & planning trips
            across India.
          </p>
        </div>

        {/* 1-Click Demo Evaluation Personas (Hackathon Magic) */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              <Sparkles size={14} className="text-orange-500" />
              <span>Instant Evaluator Demo Login</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              1-Click Switch
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {DEMO_PERSONAS.map((persona) => {
              const isActive =
                currentUser?.id === persona.id && isAuthenticated;
              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona.id)}
                  type="button"
                  className={`card-micro flex items-center justify-between p-3 rounded-md border text-left transition-all duration-200 enabled:cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/30 dark:bg-teal-950/40"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={persona.avatarUrl}
                      alt={persona.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{persona.name}</span>
                        {isActive && (
                          <span className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-1.5 py-0.2 rounded-md font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {persona.title} • {persona.email}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Traditional Auth Form */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 space-y-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Or sign in with email:
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !emailInput}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2.5 rounded-md enabled:cursor-pointer active:scale-[0.98] transition-all duration-100"
            >
              {isSubmitting ? "Signing in..." : "Sign In to Workspace"}
            </Button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Supabase Auth & RLS Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
