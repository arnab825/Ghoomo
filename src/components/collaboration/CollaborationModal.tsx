'use client';

import React, { useState } from 'react';
import { useGhoomoStore } from '@/stores/useGhoomoStore';
import { Collaborator, CollabRole } from '@/lib/types/ghoomo';
import { Button } from '@/components/ui/button';
import { X, Users, Copy, Check, Shield, Trash2, Mail, Link as LinkIcon, UserPlus } from 'lucide-react';

interface CollaborationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
}

export default function CollaborationModal({
  tripId,
  isOpen,
  onClose,
  collaborators,
}: CollaborationModalProps) {
  const { inviteCollaborator, removeCollaborator } = useGhoomoStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollabRole>('editor');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/trips/${tripId}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    inviteCollaborator(tripId, email, role);
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 space-y-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading dark:text-white">
                Plan with <span className="text-teal-600 dark:text-teal-400">friends</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite friends and co-travelers to plan together in real time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all duration-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Share Link Box */}
        <div className="space-y-2 p-3.5 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <LinkIcon size={13} className="text-orange-500" />
              <span>Shareable Trip Link</span>
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Instant Access</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 font-mono focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
            />
            <Button
              onClick={handleCopyLink}
              size="sm"
              className="bg-white hover:bg-teal-50 text-teal-600 border border-teal-600 text-xs px-3 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100 shadow-xs dark:bg-slate-900 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-slate-800"
            >
              {copied ? <Check size={14} className="text-teal-600" /> : <Copy size={14} />}
              <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        </div>

        {/* Invite by Email */}
        <form onSubmit={handleInvite} className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Mail size={13} className="text-teal-600 dark:text-teal-400" />
            <span>Invite Co-Traveler via Email</span>
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@gmail.com"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CollabRole)}
              className="px-2 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none enabled:cursor-pointer disabled:cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            >
              <option value="editor">Can Edit</option>
              <option value="viewer">Can View</option>
            </select>
            <Button
              type="submit"
              disabled={!email}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium px-4 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100 shadow-xs"
            >
              <UserPlus size={14} className="mr-1" />
              <span>Invite</span>
            </Button>
          </div>
        </form>

        {/* Collaborators List */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Trip Members ({collaborators.length})
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-800 border border-teal-200 dark:bg-slate-800 dark:text-white dark:border-slate-700">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                      c.role === 'editor'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {c.role}
                  </span>
                  {c.id !== 'collab-owner' && (
                    <button
                      onClick={() => removeCollaborator(tripId, c.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
