'use client';

import React from 'react';
import { MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { ItineraryDay } from '@/types';

interface MapPreviewProps {
  city: string;
  currentDay?: ItineraryDay;
  mapType: 'roadmap' | 'satellite';
  onToggleMapType: (type: 'roadmap' | 'satellite') => void;
}

export function MapPreview({
  city,
  currentDay,
  mapType,
  onToggleMapType,
}: MapPreviewProps) {
  return (
    <aside className="preview-col">
      <div className="map-studio-card glass-panel">
        <div className="map-card-header">
          <h3>
            <MapPin size={16} className="text-saffron" />
            Day Route Map
          </h3>
          <div className="map-toggle-pills">
            <button
              type="button"
              onClick={() => onToggleMapType('roadmap')}
              className={`map-toggle-btn ${mapType === 'roadmap' ? 'active' : ''}`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => onToggleMapType('satellite')}
              className={`map-toggle-btn ${mapType === 'satellite' ? 'active' : ''}`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* Live Route Interactive Frame */}
        <div className="map-visual-frame">
          <iframe
            title="Destination Map View"
            src={`https://www.google.com/maps?q=${encodeURIComponent(city + ', India')}&t=${mapType === 'satellite' ? 'k' : 'm'}&z=12&output=embed`}
            loading="lazy"
          />
        </div>

        {/* Numbered Stops Sequence */}
        <div className="map-stops-summary">
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sequence of Stops:
          </strong>
          {currentDay?.activities.map((act, pIdx) => (
            <div key={pIdx} className="stop-pin-item">
              <span className="stop-pin-badge">{pIdx + 1}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {act.title}
              </span>
            </div>
          ))}
        </div>

        {/* Open full route in Google Maps */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(city + ' attractions')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-day-route"
        >
          <ExternalLink size={14} />
          <span>Open Full Day in Google Maps</span>
        </a>
      </div>

      {/* Emergency & Support Card */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={16} className="text-emerald" />
          Emergency & Travel Support
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tourist Helpline (24/7):</span>
            <strong style={{ color: 'var(--text-primary)' }}>1363</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>National Emergency:</span>
            <strong style={{ color: 'var(--text-primary)' }}>112</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Police Helpline:</span>
            <strong style={{ color: 'var(--text-primary)' }}>100</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Medical Ambulance:</span>
            <strong style={{ color: 'var(--text-primary)' }}>108</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
