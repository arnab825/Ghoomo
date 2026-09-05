'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { ItineraryDay } from '@/types';

interface DayNavigatorProps {
  days: ItineraryDay[];
  selectedDayIndex: number;
  onSelectDayIndex: (index: number) => void;
  onAddDay: () => void;
  fairExpenseEstimate?: {
    stay: number;
    transport: number;
    food: number;
    activities: number;
  };
}

export function DayNavigator({
  days,
  selectedDayIndex,
  onSelectDayIndex,
  onAddDay,
  fairExpenseEstimate,
}: DayNavigatorProps) {
  return (
    <aside className="day-nav-col">
      <div className="day-nav-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Trip Days</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{days.length} Total</span>
        </div>

        {/* List of day pills */}
        {days.map((day, idx) => (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => onSelectDayIndex(idx)}
            className={`day-nav-item ${selectedDayIndex === idx ? 'active' : ''}`}
          >
            <div>
              <div className="day-nav-title">Day {day.dayNumber}</div>
              <div className="day-nav-meta">{day.theme.substring(0, 22)}...</div>
            </div>
            <span className="day-badge-counter">{day.activities.length}</span>
          </button>
        ))}

        {/* Add new day button */}
        <button
          type="button"
          onClick={onAddDay}
          className="btn-add-day-outline"
        >
          <Plus size={16} />
          <span>Add Day</span>
        </button>

        {/* Fair Expense Split Section */}
        {fairExpenseEstimate && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Fair Expense Split
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stays:</span>
                <strong>₹{fairExpenseEstimate.stay}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transport:</span>
                <strong>₹{fairExpenseEstimate.transport}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Food:</span>
                <strong>₹{fairExpenseEstimate.food}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Activities:</span>
                <strong>₹{fairExpenseEstimate.activities}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
