'use client';

import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Trash2, 
  Plus, 
  Search, 
  BedDouble 
} from 'lucide-react';
import { ItineraryDay } from '@/types';

interface DayTimelineProps {
  city: string;
  currentDay: ItineraryDay;
  onOpenHotelDrawer: () => void;
  onDeleteActivity: (index: number) => void;
  onOpenCustomModal: () => void;
  onOpenActivityDrawer: () => void;
}

export function DayTimeline({
  city,
  currentDay,
  onOpenHotelDrawer,
  onDeleteActivity,
  onOpenCustomModal,
  onOpenActivityDrawer,
}: DayTimelineProps) {
  return (
    <main className="timeline-col">
      {/* Day Theme Header Banner */}
      <div className="day-theme-banner">
        <div className="day-theme-info">
          <span className="badge badge-saffron" style={{ marginBottom: '0.35rem' }}>
            Day {currentDay.dayNumber}
          </span>
          <h2>{currentDay.theme}</h2>
          <p>{city}, India • {currentDay.activities.length} curated stops</p>
        </div>
      </div>

      {/* Transport & Fair Rates Banner */}
      <div className="transport-info-banner">
        <div className="text">
          <CheckCircle2 size={16} />
          <span>
            <strong>Transit & Fair Fare:</strong> Auto meter rates ~₹12/km. Use official prepaid booths at railway station or metro lines.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenCustomModal}
          className="btn-pill-action"
          style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem' }}
        >
          <Plus size={13} /> Add Transit Stop
        </button>
      </div>

      {/* Hotel Stay Card */}
      <div className="hotel-assigned-card">
        {currentDay.hotel ? (
          <>
            <div className="hotel-info-left">
              <img
                src={currentDay.hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                alt={currentDay.hotel.title}
                className="hotel-thumb"
              />
              <div className="hotel-assigned-details">
                <span style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Assigned Hotel / Homestay
                </span>
                <h4>{currentDay.hotel.title}</h4>
                <p>
                  ⭐ {currentDay.hotel.rating} • {currentDay.hotel.description?.substring(0, 50)}...
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="hotel-price-badge">₹{currentDay.hotel.pricePerUnit} / night</span>
              <button
                type="button"
                onClick={onOpenHotelDrawer}
                className="btn-pill-action"
                style={{ fontSize: '0.8rem' }}
              >
                Change Hotel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BedDouble size={22} className="text-accent" />
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Where to stay in {city}?</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Choose from verified heritage havelis, luxury resorts, and beach villas with real guest ratings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenHotelDrawer}
              className="btn-pill-action btn-accent"
              style={{ fontSize: '0.85rem' }}
            >
              <Search size={14} /> Search Hotels
            </button>
          </>
        )}
      </div>

      {/* Activities Timeline Cards */}
      <div className="timeline-activities-container">
        {currentDay.activities.map((act, actIdx) => (
          <div
            key={actIdx}
            className={`activity-studio-card ${act.isIndoor ? 'indoor-accent' : ''}`}
          >
            {/* Spot Photo */}
            <div className="activity-img-col">
              <img
                src={act.imageUrl || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'}
                alt={act.title}
                loading="lazy"
              />
              <span className="activity-time-pill">{act.time}</span>
            </div>

            {/* Content Details */}
            <div className="activity-content-col">
              <div className="activity-heading-row">
                <h3>{act.title}</h3>
                <span className="activity-cost-tag">₹{act.estimatedCost}</span>
              </div>
              <p className="activity-desc-text">{act.description}</p>

              {/* Etiquette and Scam-Shield Badges */}
              <div className="activity-badges-row">
                {act.isIndoor && (
                  <span className="etiquette-tip-pill" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)' }}>
                    🛡️ Monsoon Safe / Covered
                  </span>
                )}
                {act.etiquetteTip && (
                  <span className="etiquette-tip-pill">
                    <CheckCircle2 size={12} /> {act.etiquetteTip}
                  </span>
                )}
                <span className="scam-warning-pill">
                  <ShieldCheck size={12} /> Verified Spot
                </span>
              </div>
            </div>

            {/* Action Buttons: Delete and Google Maps Navigation */}
            <div className="activity-actions-col">
              <button
                type="button"
                onClick={() => onDeleteActivity(actIdx)}
                className="btn-icon-delete"
                title="Remove activity from day"
              >
                <Trash2 size={16} />
              </button>

              {act.googleMapsUrl && (
                <a
                  href={act.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-google-maps"
                  title="Open directions in Google Maps"
                >
                  <MapPin size={13} />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions: Add Custom Location & Search Experiences */}
      <div className="timeline-bottom-actions">
        <button
          type="button"
          onClick={onOpenCustomModal}
          className="btn-add-item-dashed"
        >
          <Plus size={16} />
          <span>Add Custom Location</span>
        </button>

        <button
          type="button"
          onClick={onOpenActivityDrawer}
          className="btn-add-item-dashed"
          style={{ borderColor: 'rgba(255, 153, 51, 0.4)', color: 'var(--accent-saffron-light)' }}
        >
          <Search size={16} />
          <span>Search Experiences & Activities</span>
        </button>
      </div>
    </main>
  );
}
