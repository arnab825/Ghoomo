'use client';

import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  User,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactFormInputSchema } from '@/schemas/inputSchemas';

export default function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = ContactFormInputSchema.safeParse({
      name: fullName,
      email,
      subject: category,
      message,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please verify your contact entries.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFullName('');
      setEmail('');
      setMessage('');
      setErrorMsg(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <MessageSquare size={14} />
            <span>We are here to help</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white font-heading">
            Get in touch with us
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Have a question about your learning roadmap, subscriptions, or feedback? Send us a message and our team will get back to you promptly.
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Info Column (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                  Contact Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Reach out directly or fill in the form. We usually respond within 1 business day.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Email Support
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      support@eduspark.app
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Response Guarantee
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Within 24 hours, Monday – Saturday
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      FAQ & Help Center
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Self-service answers available anytime
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column (7 cols) */}
          <div className="md:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                      Message Received!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Thank you for reaching out. We will review your message and reply back shortly.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="text-xs font-semibold px-5 py-2 rounded-xl mt-2"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Your Name
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Morgan"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@example.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Topic / Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option>General Inquiry</option>
                      <option>Subscription & Billing</option>
                      <option>Technical Support</option>
                      <option>Feature Request or Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Your Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we assist your learning journey today?"
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
