'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { PRICING_PLANS, PricingPlan } from '@/lib/types/ghoomo';
import { useAuthStore } from '@/stores/useAuthStore';
import { createRazorpayOrderAction, verifyPaymentAndAddCreditsAction } from '@/app/actions/paymentActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { currentUser, addCredits } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('explorer');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ planName: string; creditsAdded: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async (plan: PricingPlan) => {
    setLoadingPlan(plan.id);
    setErrorMessage(null);

    try {
      // 1. Create Server-Side Razorpay Order
      const orderRes = await createRazorpayOrderAction(plan.id, currentUser.id);

      if (!orderRes.success || !orderRes.orderId) {
        throw new Error(orderRes.error || 'Failed to initialize payment gateway.');
      }

      // 2. Client Checkout Modal
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'Ghoomo Travel Studio',
          description: `${plan.name} Plan - ${plan.credits} AI Credits`,
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80',
          order_id: orderRes.orderId,
          handler: async function (response: any) {
            // 3. Verify Signature on Server
            const verifyRes = await verifyPaymentAndAddCreditsAction(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              plan.id,
              currentUser.id
            );

            if (verifyRes.success) {
              addCredits(verifyRes.creditsAdded);
              setPaymentSuccess({
                planName: verifyRes.planName,
                creditsAdded: verifyRes.creditsAdded,
              });
            } else {
              setErrorMessage(verifyRes.message || 'Signature verification failed.');
            }
          },
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
            contact: '9999999999',
          },
          notes: {
            userId: currentUser.id,
            planId: plan.id,
          },
          theme: {
            color: '#0d9488', // Teal-600
          },
          modal: {
            ondismiss: function () {
              setLoadingPlan(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(resp.error?.description || 'Payment was declined or cancelled.');
          setLoadingPlan(null);
        });
        rzp.open();
      } else {
        // Fallback simulated success for seamless browser testing without external script block
        await new Promise((r) => setTimeout(r, 600));
        const demoVerify = await verifyPaymentAndAddCreditsAction(
          orderRes.orderId,
          `pay_demo_${Date.now()}`,
          `demo_sig_${Date.now()}`,
          plan.id,
          currentUser.id
        );

        if (demoVerify.success) {
          addCredits(demoVerify.creditsAdded);
          setPaymentSuccess({
            planName: demoVerify.planName,
            creditsAdded: demoVerify.creditsAdded,
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 space-y-12 animate-in fade-in duration-200">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/20 bg-teal-50 px-3.5 py-1 text-xs text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
            <Sparkles size={13} className="text-teal-600" />
            <span>Pay Only For What You Use</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-slate-900 dark:text-white font-heading">
            Simple, Transparent <span className="text-teal-600 italic">Travel Credits</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Turn social travel Reels, Shorts, and blogs into actionable itineraries across India.
            Every new explorer starts with <strong>9 free credits</strong>.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs text-slate-500">
            <span>Your Balance:</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-md border border-teal-200 dark:border-teal-800">
              {currentUser.credits ?? 9} Credits Available
            </span>
          </div>
        </div>

        {/* Success Modal / Banner */}
        {paymentSuccess && (
          <div className="max-w-xl mx-auto rounded-lg border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3 shadow-md dark:border-emerald-800 dark:bg-emerald-950/60 animate-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 font-heading">
              Payment Successful!
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Added <strong>{paymentSuccess.creditsAdded} Credits</strong> from the {paymentSuccess.planName} Plan.
              You now have <strong>{currentUser.credits} credits</strong> to build smart trip plans!
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Link href="/trips">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs active:scale-[0.98] cursor-pointer">
                  Go to My Trips
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentSuccess(null)}
                className="text-xs cursor-pointer"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-xl mx-auto rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isPopular = plan.badge === 'Most Popular';
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                  isPopular
                    ? 'border-teal-600 bg-white shadow-xl ring-2 ring-teal-600/20 dark:border-teal-500 dark:bg-slate-900'
                    : 'border-slate-200 bg-white shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-teal-600 text-white px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-slate-400">/ one-time</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800">
                    <Zap size={13} className="fill-orange-500 text-orange-500" />
                    <span>{plan.credits} AI Credits</span>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check size={14} className="text-teal-600 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleCheckout(plan)}
                    disabled={isLoading}
                    className={`w-full py-2.5 text-xs font-semibold rounded-md transition-all duration-100 shadow-xs cursor-pointer active:scale-[0.98] ${
                      isPopular
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    }`}
                  >
                    {isLoading ? (
                      <span>Opening Gateway...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <CreditCard size={14} />
                        <span>Buy {plan.name} (₹{plan.price})</span>
                      </span>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Secured by Razorpay • Instant Credit Balance
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Credit Rules FAQ Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
              How Credits Work
            </h3>
            <p className="text-xs text-slate-500">
              Only AI server calls deduct credits. All browsing, mapping, and collaboration are 100% free forever.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>AI Itinerary Generation</span>
                <span className="font-mono text-teal-700 font-extrabold dark:text-teal-400">3 Credits</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Multi-day clustering with travel times, route validation, and daily themes.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Reel / Short Extraction</span>
                <span className="font-mono text-teal-700 font-extrabold dark:text-teal-400">1 Credit</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                AI parsing of video hashtags, captions, places, and canonical coordinates.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Place Enrichment</span>
                <span className="font-mono text-teal-700 font-extrabold dark:text-teal-400">1 Credit</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Deep details, HD imagery, and geo-matching from India reference database.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 p-4 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Viewing, Maps & Polls</span>
                <span className="font-mono text-emerald-600 font-extrabold">0 Credits</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Collaborate with friends, vote on polls, drag & drop itinerary items. Always free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
