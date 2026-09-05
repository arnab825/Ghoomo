'use client';

import React from 'react';
import { Compass, X } from 'lucide-react';

interface ActivityItemCatalog {
  id: string;
  title: string;
  category: string;
  city: string;
  price: number;
  rating: number;
  duration: string;
  imageUrl: string;
  description: string;
}

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItemCatalog[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  onAddActivity: (activity: ActivityItemCatalog) => void;
}

const CATEGORIES = [
  'All',
  'Water Sports',
  'Boat Rides',
  'Heritage Guides',
  'Culinary & Markets',
  'Adventure',
];

export function ActivityDrawer({
  isOpen,
  onClose,
  activities,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  onAddActivity,
}: ActivityDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="sliding-drawer-backdrop" onClick={onClose}>
      <div className="sliding-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>
            <Compass size={20} className="text-saffron" />
            Explore Experiences
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-close-drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="form-group" style={{ margin: 0 }}>
          <input
            type="text"
            placeholder="Search water sports, boat rides, guides..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryFilterChange(cat)}
              className={`btn-pill-action ${categoryFilter === cat ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Items */}
        <div className="drawer-items-list">
          {activities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No experiences found matching "{searchQuery}".
            </p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="drawer-listing-card">
                <img
                  src={act.imageUrl}
                  alt={act.title}
                  className="drawer-card-img"
                />
                <div className="drawer-card-body">
                  <div>
                    <h4>{act.title}</h4>
                    <div className="drawer-card-meta">
                      <span>⭐ {act.rating}</span>
                      <span>•</span>
                      <span>{act.duration}</span>
                      <span>•</span>
                      <span style={{ color: '#38bdf8' }}>{act.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="drawer-card-price">₹{act.price}</span>
                    <button
                      type="button"
                      onClick={() => onAddActivity(act)}
                      className="btn-add-drawer-item"
                    >
                      + Add to Day
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
