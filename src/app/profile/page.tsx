'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, validateUsername } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  User,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  FolderHeart,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  KeyRound,
  BadgeCheck,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const {
    user,
    currentUser,
    updateUsername,
    updateProfileName,
    changePassword,
    deleteAccount,
  } = useAuthStore();

  const activeUser = user || currentUser;

  // Form states
  const [fullNameInput, setFullNameInput] = useState(activeUser.fullName || activeUser.name || '');
  const [usernameInput, setUsernameInput] = useState(activeUser.username || 'traveler_8472');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & status states
  const [nameLoading, setNameLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Feedback notifications
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 1. Update Full Name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    setNameLoading(true);
    setStatusMessage(null);
    const res = await updateProfileName(fullNameInput);
    setNameLoading(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Your name has been updated successfully.' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update name.' });
    }
  };

  // 3. Update Username
  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameLoading(true);
    setStatusMessage(null);

    const result = updateUsername(usernameInput);
    setUsernameLoading(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Username successfully updated to @${usernameInput.trim().toLowerCase()}`,
      });
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to update username.' });
    }
  };

  // 3. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({
        type: 'success',
        text: 'Your password has been changed successfully. You can now use it to sign in.',
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to change password.' });
    }
  };

  // 4. Delete Account
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const res = await deleteAccount();
    setDeleteLoading(false);
    setShowDeleteModal(false);

    if (res.success) {
      router.push('/');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to delete account.' });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
          Profile & <span className="text-saffron-500 italic">Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal information, credentials, security, and learning preferences.
        </p>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Account Summary Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-5 text-center flex flex-col items-center backdrop-blur-sm">
            <div className="relative">
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.fullName || activeUser.name}
                referrerPolicy="no-referrer"
                className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 shadow-md dark:border-slate-800"
              />
              <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full shadow-xs">
                <ShieldCheck size={14} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {activeUser.fullName || activeUser.name}
              </h3>
              <p className="text-xs font-mono text-saffron-500 font-semibold">
                @{activeUser.username}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 break-all">{activeUser.email}</p>
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  {activeUser.role}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1">
                  <BadgeCheck size={11} />
                  <span>Verified</span>
                </span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">AI Credits:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  {activeUser.credits ?? 9} Credits
                </span>
              </div>
              <Link href="/pricing" className="block pt-2">
                <Button
                  size="sm"
                  className="w-full bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-semibold rounded-xl shadow-xs enabled:cursor-pointer transition-all"
                >
                  <Zap size={13} className="mr-1" />
                  <span>Top-up Credits</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Navigation
            </h4>
            <div className="space-y-2">
              <Link
                href={activeUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>
              <Link
                href="/trips"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderHeart size={14} className="text-emerald-600" />
                  <span>Your Trips Library</span>
                </div>
                <ArrowRight size={13} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Information, Password, and Danger Zone */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Personal Information (Name & Username) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your public display name and unique community username handle.
              </p>
            </div>

            {/* Change Full Name Form */}
            <form onSubmit={handleUpdateName} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Display Full Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white transition-all"
                />
                <Button
                  type="submit"
                  disabled={nameLoading}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl enabled:cursor-pointer disabled:cursor-not-allowed shrink-0 px-4"
                >
                  {nameLoading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Name</span>}
                </Button>
              </div>
            </form>

            {/* Change Username Form */}
            <form onSubmit={handleUpdateUsername} className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Unique Username Handle
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                    placeholder="traveler_8472"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={usernameLoading}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl enabled:cursor-pointer disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 shrink-0 px-4"
                >
                  {usernameLoading ? <Loader2 size={14} className="animate-spin" /> : <span>Save Handle</span>}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                3–20 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
            <div className="flex items-start gap-2.5">
              <KeyRound size={18} className="text-saffron-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Security & Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Set or change your account password. If you signed in with Google, creating a password allows you to sign in via email & password as well.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 enabled:cursor-pointer"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 enabled:cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={passwordLoading || !newPassword}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl enabled:cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Section 3: Danger Zone (Delete Account) */}
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-200">
                  Danger Zone
                </h3>
                <p className="text-xs text-red-700/80 dark:text-red-400/80">
                  Permanently delete your Ghoomo account and all associated experiential learning journeys, reflections, and personal progress.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 enabled:cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Account</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Account Confirmation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to permanently delete your account for{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{activeUser.email}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="w-full text-xs font-semibold rounded-xl enabled:cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 enabled:cursor-pointer disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
