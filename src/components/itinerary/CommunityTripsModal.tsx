'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CommunityTrip {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  budgetTotal: number;
  travelStyle: string;
  category: string;
  likes: number;
  author: string;
  coverImage: string;
  highlights: string[];
  days: any[];
}

interface CommunityTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: CommunityTrip[];
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  onCloneTrip: (trip: CommunityTrip) => void;
}

const CATEGORIES = ['All', 'Solo', 'Couples', 'Family'];

export function CommunityTripsModal({
  isOpen,
  onClose,
  trips,
  categoryFilter,
  onCategoryFilterChange,
  onCloneTrip,
}: CommunityTripsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-content-panel" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>Explore Community Trips</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Discover itineraries curated by fellow travelers and clone them into your workspace with one click.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-close-drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {CATEGORIES.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onCategoryFilterChange(tab)}
              className={`btn-pill-action ${categoryFilter === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid of Community Cards */}
        <div className="community-trips-grid">
          {trips.map((t) => (
            <div key={t.id} className="community-trip-card">
              <img src={t.coverImage} alt={t.title} className="comm-trip-cover" />
              <div className="comm-trip-body">
                <h4>{t.title}</h4>
                <div className="comm-trip-meta">
                  <span>📍 {t.destination} • {t.durationDays} Days</span>
                  <span>❤️ {t.likes}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                  By {t.author}
                </p>
                <button
                  type="button"
                  onClick={() => onCloneTrip(t)}
                  className="btn btn-primary w-full"
                  style={{ fontSize: '0.8rem', padding: '0.45rem', marginTop: 'auto' }}
                >
                  Clone & Customize Trip
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
