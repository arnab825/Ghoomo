'use client';

import React, { useState } from 'react';
import { useBudgetItemMutations, useChecklistItemMutations } from '@/hooks/useTripQueries';
import { BudgetItem, ChecklistItem, BudgetCategory, ChecklistCategory } from '@/lib/types/ghoomo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/shared/ToastContext';
import {
  DollarSign,
  CheckSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Tag,
  Hotel,
  Car,
  Utensils,
  Compass,
  ShoppingBag,
  MoreHorizontal,
} from 'lucide-react';

interface BudgetAndChecklistProps {
  tripId: string;
  budgetTotal: number;
  budgetItems: BudgetItem[];
  checklistItems: ChecklistItem[];
}

const CATEGORY_ICONS: Record<BudgetCategory, any> = {
  stay: Hotel,
  transport: Car,
  food: Utensils,
  activity: Compass,
  shopping: ShoppingBag,
  other: Tag,
};

export default function BudgetAndChecklist({
  tripId,
  budgetTotal,
  budgetItems,
  checklistItems,
}: BudgetAndChecklistProps) {
  const budgetMutations = useBudgetItemMutations(tripId);
  const checklistMutations = useChecklistItemMutations(tripId);
  const { toast, confirmModal } = useToast();

  const [activeTab, setActiveTab] = useState<'budget' | 'checklist'>('budget');

  // Budget form state
  const [bDesc, setBDesc] = useState('');
  const [bAmount, setBAmount] = useState('');
  const [bCat, setBCat] = useState<BudgetCategory>('stay');

  // Checklist form state
  const [cTitle, setCTitle] = useState('');
  const [cCat, setCCat] = useState<ChecklistCategory>('packing');

  const totalSpent = budgetItems.reduce((acc, item) => acc + item.amount, 0);
  const remainingBudget = budgetTotal - totalSpent;
  const budgetPercentage = Math.min(100, Math.round((totalSpent / budgetTotal) * 100));

  const completedTasks = checklistItems.filter((i) => i.isCompleted).length;
  const checklistPercentage =
    checklistItems.length > 0 ? Math.round((completedTasks / checklistItems.length) * 100) : 0;

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bDesc || !bAmount) return;
    await budgetMutations.add.mutateAsync({
      description: bDesc,
      amount: parseFloat(bAmount) || 0,
      category: bCat,
      isPaid: false,
    });
    setBDesc('');
    setBAmount('');
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle) return;
    await checklistMutations.add.mutateAsync({
      title: cTitle,
      category: cCat,
    });
    setCTitle('');
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 pb-2 gap-2 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'budget'
              ? 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign size={14} />
          <span>Budget Tracker (₹{totalSpent.toLocaleString('en-IN')})</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
          }`}
        >
          <CheckSquare size={14} />
          <span>Trip Checklist ({completedTasks}/{checklistItems.length})</span>
        </button>
      </div>

      {/* 1. BUDGET TAB */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex justify-between items-end text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] dark:text-slate-400">Allocated Expenses</span>
                <span className="text-lg font-bold text-slate-900 font-mono dark:text-white">
                  ₹{totalSpent.toLocaleString('en-IN')}{' '}
                  <span className="text-xs text-slate-500 font-normal">/ ₹{budgetTotal.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px] dark:text-slate-400">Remaining Balance</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-rose-400'
                  }`}
                >
                  ₹{remainingBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetPercentage > 90 ? 'bg-red-600' : 'bg-teal-600'
                }`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
          </div>

          {/* Quick Add Expense Form */}
          <form onSubmit={handleAddBudget} className="flex gap-2">
            <select
              value={bCat}
              onChange={(e) => setBCat(e.target.value as BudgetCategory)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <option value="stay">Stay</option>
              <option value="transport">Transport</option>
              <option value="food">Food</option>
              <option value="activity">Activity</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="e.g. Haveli room booking"
              value={bDesc}
              onChange={(e) => setBDesc(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
            />
            <input
              type="number"
              placeholder="₹ Amount"
              value={bAmount}
              onChange={(e) => setBAmount(e.target.value)}
              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 rounded-lg cursor-pointer"
            >
              <Plus size={14} />
            </Button>
          </form>

          {/* Expense Items List */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {budgetItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No budget items yet. Add estimated costs above.
              </div>
            ) : (
              budgetItems.map((item) => {
                const Icon = CATEGORY_ICONS[item.category] || MoreHorizontal;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white text-xs hover:border-slate-300 transition-colors dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-medium text-slate-900 truncate dark:text-white">{item.description}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider dark:text-slate-400">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => budgetMutations.toggle.mutateAsync(item.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer ${
                          item.isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {item.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          confirmModal({
                            title: 'Remove Expense',
                            message: `Are you sure you want to remove "${item.description}" (₹${item.amount.toLocaleString('en-IN')})?`,
                            confirmText: 'Remove',
                            variant: 'danger',
                            onConfirm: async () => {
                              await budgetMutations.remove.mutateAsync(item.id);
                              toast.success(`Removed expense "${item.description}"`);
                            },
                          });
                        }}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Delete expense"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          {/* Progress Card */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between dark:border-slate-800 dark:bg-slate-950/70">
            <div className="text-xs">
              <span className="text-slate-500 block text-[11px] dark:text-slate-400">Packing & Prep Readiness</span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {completedTasks} of {checklistItems.length} items completed ({checklistPercentage}%)
              </span>
            </div>
            <div className="h-9 w-9 rounded-full border-2 border-orange-500 flex items-center justify-center text-xs font-bold text-orange-600 font-mono dark:text-white">
              {checklistPercentage}%
            </div>
          </div>

          {/* Add Checklist Item */}
          <form onSubmit={handleAddChecklist} className="flex gap-2">
            <select
              value={cCat}
              onChange={(e) => setCCat(e.target.value as ChecklistCategory)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <option value="packing">Packing</option>
              <option value="booking">Booking</option>
              <option value="documents">Documents</option>
              <option value="gear">Gear</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="e.g. Pack sunscreen & wide-angle lens"
              value={cTitle}
              onChange={(e) => setCTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-orange-500"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 rounded-lg cursor-pointer"
            >
              <Plus size={14} />
            </Button>
          </form>

          {/* Checklist Items */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {checklistItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No checklist items yet. Add tasks or packing reminders above.
              </div>
            ) : (
              checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => checklistMutations.toggle.mutateAsync(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    item.isCompleted
                      ? 'border-slate-200 bg-slate-100/70 text-slate-400 line-through dark:border-slate-800/50 dark:bg-slate-950/40 dark:text-slate-500'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-950 dark:text-slate-500">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        checklistMutations.remove.mutateAsync(item.id);
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
