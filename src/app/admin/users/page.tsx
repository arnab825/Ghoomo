'use client';

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AppDrawer from '@/components/shared/AppDrawer';
import { supabase } from '@/lib/supabase/client';
import { Users, Search, ChevronRight, Award, Target, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LearnerRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  goalCount?: number;
  masteredCount?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<LearnerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<LearnerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setUsers(
            data.map((u: any) => ({
              id: u.id,
              email: u.email || 'learner@domain.edu',
              fullName: u.full_name || 'Learner',
              role: u.role || 'learner',
              createdAt: new Date(u.created_at).toLocaleDateString(),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Learners & User Engagement"
        subtitle="Manage learner profiles, inspect learning velocity, and monitor account status."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-saffron-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{filteredUsers.length} total learners found</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-3xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="p-4 pl-6">Learner</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((learner) => (
                  <tr
                    key={learner.id}
                    onClick={() => setSelectedUser(learner)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                          {learner.fullName[0] || 'L'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {learner.fullName}
                          </div>
                          <div className="text-3xs text-slate-400 font-mono">
                            {learner.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-3xs font-bold px-2.5 py-0.5 rounded-full ${
                          learner.role === 'admin'
                            ? 'bg-saffron-500/10 text-saffron-600 dark:text-saffron-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {learner.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-3xs text-slate-400">
                      {learner.createdAt}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-7 px-3 text-xs"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Drill-Down User Drawer */}
      <AppDrawer
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.fullName || 'Learner Profile'}
        description={selectedUser?.email || ''}
      >
        {selectedUser && (
          <div className="space-y-6 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-3xs uppercase font-bold text-slate-400">
                User Identifier
              </div>
              <div className="font-mono text-xs text-slate-700 dark:text-slate-300 select-all">
                {selectedUser.id}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-3xs uppercase font-bold text-slate-400">
                Account Attributes
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span>Platform Role</span>
                <span className="font-bold capitalize">{selectedUser.role}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span>Account Created</span>
                <span className="font-mono">{selectedUser.createdAt}</span>
              </div>
            </div>
          </div>
        )}
      </AppDrawer>
    </div>
  );
}
