'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Smartphone,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RazorpayCheckoutInputSchema } from '@/schemas/inputSchemas';

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  coursesLimit: number;
  period: string;
  description: string;
}

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanDetails | null;
  onSuccess: (plan: PlanDetails) => void;
  userEmail?: string;
  userName?: string;
}

export default function RazorpayCheckoutModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
  userEmail = 'learner@example.com',
  userName = 'Learner',
}: RazorpayCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

  const handleSimulatePayment = () => {
    setValidationError(null);
    const validation = RazorpayCheckoutInputSchema.safeParse({
      planId: plan.id,
      amount: plan.price,
      currency: 'INR',
    });

    if (!validation.success) {
      setValidationError(validation.error.issues[0]?.message || 'Invalid plan details.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setTimeout(() => {
        onSuccess(plan);
        setIsPaid(false);
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                R
              </div>
              <div>
                <span className="text-2xs font-bold tracking-widest uppercase text-blue-200 block">
                  Razorpay Checkout (Test Mode)
                </span>
                <h3 className="text-lg font-bold font-heading">{plan.name} Plan</h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xs text-blue-200 block">Total Amount</span>
              <span className="text-xl font-bold">₹{plan.price}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isPaid ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Successful!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your subscription to the <strong>{plan.name} Plan</strong> ({plan.coursesLimit} courses active) is now activated.
              </p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {plan.name} Monthly Subscription
                  </span>
                  <span className="text-2xs text-slate-500 dark:text-slate-400">
                    Up to {plan.coursesLimit} active learning topics per month
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₹{plan.price}/{plan.period}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'upi'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone size={18} />
                    <span className="text-2xs">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-2xs">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'netbanking'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Building2 size={18} />
                    <span className="text-2xs">NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Dynamic input for method */}
              {paymentMethod === 'upi' && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="text-2xs font-semibold text-slate-500">Instant UPI VPA (Test)</span>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                  <span className="text-2xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> Google Pay, PhonePe, Paytm, or BHIM supported
                  </span>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="text-2xs font-semibold text-slate-500">Test Card Details</span>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="12/28"
                      readOnly
                      className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                    <input
                      type="text"
                      value="•••"
                      readOnly
                      className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="text-2xs font-semibold text-slate-500">Select Bank</span>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
                    <option>HDFC Bank</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              {/* Action Button */}
              <Button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Secure Test Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Pay ₹{plan.price} via Razorpay</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-2xs text-slate-400">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>256-bit Encrypted Test Sandbox • 100% Secure</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
