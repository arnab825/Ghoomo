'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Target,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import RazorpayCheckoutModal, { PlanDetails } from '@/components/shared/RazorpayCheckoutModal';

const PLANS: PlanDetails[] = [
  {
    id: 'plan_starter',
    name: 'Starter',
    price: 499,
    coursesLimit: 5,
    period: 'month',
    description: 'Perfect for focused learners mastering core skills one at a time.',
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: 999,
    coursesLimit: 10,
    period: 'month',
    description: 'Our most popular choice for students and engineers seeking accelerated mastery.',
  },
  {
    id: 'plan_mastery',
    name: 'Mastery',
    price: 1499,
    coursesLimit: 15,
    period: 'month',
    description: 'Unrestricted access for ambitious self-learners exploring wide multi-disciplinary fields.',
  },
];

export default function PricingPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeSubscribedPlan, setActiveSubscribedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: PlanDetails) => {
    if (!isAuthenticated) {
      openAuthModal('sign-up');
      return;
    }
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (plan: PlanDetails) => {
    setActiveSubscribedPlan(plan.id);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles size={14} />
            <span>Transparent Monthly Subscriptions</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white font-heading">
            Simple, honest pricing for lifelong learners
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Choose how many active learning roadmaps you want to navigate simultaneously. Switch or cancel anytime.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isPro = plan.id === 'plan_pro';
            const isCurrent = activeSubscribedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? 'border-2 border-indigo-600 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-600/10'
                    : 'border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow-sm'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  </div>

                  {/* Highlights */}
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Target size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Up to {plan.coursesLimit} active courses at a time</span>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Turn-by-turn personalized study roadmaps</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Interactive question drills with instant feedback</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Concept mastery tracking & accuracy metrics</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Course archive & restore management</span>
                    </li>
                    {isPro && (
                      <>
                        <li className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Zap size={16} className="text-amber-500 shrink-0" />
                          <span>Priority AI study roadmap generation</span>
                        </li>
                        <li className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Award size={16} className="text-amber-500 shrink-0" />
                          <span>Detailed misconception diagnostics</span>
                        </li>
                      </>
                    )}
                    {plan.id === 'plan_mastery' && (
                      <>
                        <li className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Sparkles size={16} className="text-indigo-600 shrink-0" />
                          <span>24/7 AI Tutor & Copilot assistant</span>
                        </li>
                        <li className="flex items-center gap-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Award size={16} className="text-indigo-600 shrink-0" />
                          <span>Unlimited question drills & custom practice sets</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : isPro
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <ShieldCheck size={15} />
                        <span>Active Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{isAuthenticated ? 'Subscribe with Razorpay' : 'Get Started'}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything you need to know about our subscriptions and learning roadmaps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={15} className="text-indigo-600" />
                What is an "active course"?
              </h3>
              <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
                An active course is any topic or syllabus you are currently pursuing with active progress tracking. You can archive completed courses at any time to free up capacity for new ones.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={15} className="text-indigo-600" />
                How does test Razorpay payment work?
              </h3>
              <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Our checkout runs on Razorpay sandbox mode. You can test card, UPI, or NetBanking flows instantly without actual charges.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={15} className="text-indigo-600" />
                Can I restore archived courses?
              </h3>
              <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes! From your Archive page, you can either restore an archived course back to active status with all progress intact, or permanently delete it.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle size={15} className="text-indigo-600" />
                Can I cancel anytime?
              </h3>
              <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Yes. Subscriptions are billed on a month-to-month basis and can be modified or cancelled at any time from your Settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Modal */}
      <RazorpayCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={selectedPlan}
        onSuccess={handlePaymentSuccess}
        userEmail={user?.email || undefined}
      />
    </div>
  );
}
