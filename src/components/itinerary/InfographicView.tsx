'use client';

import React from 'react';
import { ItineraryPlan } from '@/types';

interface InfographicViewProps {
  city: string;
  style: string;
  itinerary: ItineraryPlan;
  onBackToEditor: () => void;
}

export function InfographicView({
  city,
  style,
  itinerary,
  onBackToEditor,
}: InfographicViewProps) {
  const totalActivities = itinerary.days.reduce((acc, d) => acc + d.activities.length, 0);
  const totalStays = itinerary.days.filter((d) => d.hotel).length || 1;

  return (
    <div className="infographic-view-container animate-fade-in">
      <div className="infographic-hero-card">
        <span className="badge badge-saffron" style={{ marginBottom: '0.75rem' }}>
          TRIP INFOGRAPHIC • AI SMART TRAVEL
        </span>
        <h2>{city}, India</h2>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: 0 }}>
          {itinerary.durationDays} Days • Style: {style.toUpperCase()} • Curated by Multi-LLM AI
        </p>

        {/* 4 Stat Counters */}
        <div className="infographic-stats-grid">
          <div className="stat-counter-block">
            <h3>{itinerary.durationDays}</h3>
            <p>Total Days</p>
          </div>
          <div className="stat-counter-block">
            <h3>{totalActivities}</h3>
            <p>Experiences</p>
          </div>
          <div className="stat-counter-block">
            <h3>{totalStays}</h3>
            <p>Verified Stays</p>
          </div>
          <div className="stat-counter-block">
            <h3>₹{itinerary.budgetTotal.toLocaleString()}</h3>
            <p>Fair Budget</p>
          </div>
        </div>
      </div>

      {/* Daily Highlights Roadmap */}
      <div className="infographic-highlights-card">
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Daily Highlights Roadmap
        </h3>
        {itinerary.days.map((d) => (
          <div key={d.dayNumber} className="infographic-day-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-saffron">Day {d.dayNumber}</span>
              <strong style={{ fontSize: '1.1rem' }}>{d.theme}</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
              {d.activities.map((a) => a.title).join('  ➔  ')}
            </p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={onBackToEditor}
          className="btn btn-primary"
        >
          Back to Day Planner Editor
        </button>
      </div>
    </div>
  );
}
