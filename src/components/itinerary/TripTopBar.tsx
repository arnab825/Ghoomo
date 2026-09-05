'use client';

import React from 'react';
import { Sparkles, Compass, Users, Share2, Download, CloudRain } from 'lucide-react';

interface WeatherInfo {
  temp: string;
  condition: string;
  highLow: string;
  icon: string;
}

interface TripTopBarProps {
  city: string;
  weather: WeatherInfo;
  style: string;
  onSelectStyle: (style: string) => void;
  viewMode: 'timeline' | 'infographic';
  onToggleViewMode: () => void;
  onOptimizeRoute: () => void;
  onOpenCommunity: () => void;
  onOpenShare: () => void;
  onDownloadPdf: () => void;
  onSimulateMonsoon: () => void;
  weatherAlertActive: boolean;
  rerouting: boolean;
}

export function TripTopBar({
  city,
  weather,
  style,
  onSelectStyle,
  viewMode,
  onToggleViewMode,
  onOptimizeRoute,
  onOpenCommunity,
  onOpenShare,
  onDownloadPdf,
  onSimulateMonsoon,
  weatherAlertActive,
  rerouting,
}: TripTopBarProps) {
  return (
    <div className="trip-top-bar animate-fade-in">
      <div className="trip-title-section">
        <h1>
          Trip to {city}
          <span className="badge badge-saffron" style={{ fontSize: '0.75rem', verticalAlign: 'middle' }}>
            AI Studio
          </span>
        </h1>

        {/* Live Weather Pill */}
        <div className="weather-widget-badge">
          <span>{weather.icon}</span>
          <span>{weather.temp}</span>
          <span style={{ opacity: 0.8 }}>({weather.condition})</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>H/L: {weather.highLow}</span>
        </div>

        {/* Trip Pace Selector */}
        <div className="pace-selector-group">
          <button
            type="button"
            onClick={() => onSelectStyle('tight')}
            className={`pace-pill-btn ${style === 'tight' ? 'active' : ''}`}
          >
            Tight (Fast)
          </button>
          <button
            type="button"
            onClick={() => onSelectStyle('balanced')}
            className={`pace-pill-btn ${style === 'balanced' ? 'active' : ''}`}
          >
            Balanced
          </button>
          <button
            type="button"
            onClick={() => onSelectStyle('relaxed')}
            className={`pace-pill-btn ${style === 'relaxed' ? 'active' : ''}`}
          >
            Relaxed
          </button>
        </div>
      </div>

      {/* Action Buttons Cluster */}
      <div className="top-actions-cluster">
        {/* Toggle between Day Timeline and Infographic Summary */}
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`btn-pill-action ${viewMode === 'infographic' ? 'active' : ''}`}
        >
          <Sparkles size={15} />
          <span>{viewMode === 'timeline' ? 'Infographic View' : 'Day Planner View'}</span>
        </button>

        {/* Optimize Route Button */}
        <button
          type="button"
          onClick={onOptimizeRoute}
          className="btn-pill-action"
          title="Sort activities logically to minimize travel time"
        >
          <Compass size={15} />
          <span>Optimize Route</span>
        </button>

        {/* Explore Community Trips */}
        <button
          type="button"
          onClick={onOpenCommunity}
          className="btn-pill-action"
        >
          <Users size={15} />
          <span>Community Trips</span>
        </button>

        {/* Share Trip Modal Trigger */}
        <button
          type="button"
          onClick={onOpenShare}
          className="btn-pill-action"
        >
          <Share2 size={15} />
          <span>Share</span>
        </button>

        {/* Download PDF via browser print */}
        <button
          type="button"
          onClick={onDownloadPdf}
          className="btn-pill-action btn-accent"
        >
          <Download size={15} />
          <span>Download PDF</span>
        </button>

        {/* Monsoon Alert Reality Simulator */}
        <button
          type="button"
          onClick={onSimulateMonsoon}
          disabled={rerouting || weatherAlertActive}
          className="btn-pill-action btn-monsoon"
          title="Simulates heavy rain: swaps open-air sights for covered museums & artisan havelis"
        >
          <CloudRain size={15} />
          <span>{weatherAlertActive ? 'Adaptive Plan Active' : 'Simulate Monsoon Alert (2 PM)'}</span>
        </button>
      </div>
    </div>
  );
}
