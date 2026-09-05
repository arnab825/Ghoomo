'use client';

import React from 'react';
import { BedDouble, X } from 'lucide-react';
import { HomestayListing } from '@/types';

interface HotelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  hotels: HomestayListing[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddHotel: (hotel: HomestayListing) => void;
}

export function HotelDrawer({
  isOpen,
  onClose,
  city,
  hotels,
  searchQuery,
  onSearchChange,
  onAddHotel,
}: HotelDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="sliding-drawer-backdrop" onClick={onClose}>
      <div className="sliding-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>
            <BedDouble size={20} className="text-saffron" />
            Search Hotels & Havelis
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
            placeholder={`Search hotels in ${city}...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Hotels Listing */}
        <div className="drawer-items-list">
          {hotels.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No hotels found matching "{searchQuery}". Try clearing your search.
            </p>
          ) : (
            hotels.map((h) => (
              <div key={h.id} className="drawer-listing-card">
                <img
                  src={h.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                  alt={h.title}
                  className="drawer-card-img"
                />
                <div className="drawer-card-body">
                  <div>
                    <h4>{h.title}</h4>
                    <div className="drawer-card-meta">
                      <span>⭐ {h.rating}</span>
                      <span>•</span>
                      <span>{h.city}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="drawer-card-price">₹{h.pricePerUnit} / night</span>
                    <button
                      type="button"
                      onClick={() => onAddHotel(h)}
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
