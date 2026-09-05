'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CustomActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  onAddCustomActivity: (activity: {
    title: string;
    time: string;
    location: string;
    estimatedCost: number;
    type: string;
    description: string;
    isIndoor: boolean;
  }) => void;
}

export function CustomActivityModal({
  isOpen,
  onClose,
  city,
  onAddCustomActivity,
}: CustomActivityModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('02:00 PM - 03:30 PM');
  const [location, setLocation] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(250);
  const [type, setType] = useState('cultural');
  const [description, setDescription] = useState('');
  const [isIndoor, setIsIndoor] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddCustomActivity({
      title: title.trim(),
      time: time.trim() || '02:00 PM - 03:30 PM',
      location: location.trim() || city,
      estimatedCost: Number(estimatedCost) || 0,
      type,
      description: description.trim() || `Custom stop in ${city}.`,
      isIndoor,
    });

    // Reset form
    setTitle('');
    setLocation('');
    setDescription('');
    setIsIndoor(false);
    onClose();
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-content-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3>Add Custom Location</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-close-drawer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Activity or Stop Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sunset drinks at Bar Palladio or Meeting friend"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Time Window</label>
              <input
                type="text"
                placeholder="e.g. 04:00 PM - 05:30 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Cost (₹)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location / Landmark</label>
            <input
              type="text"
              placeholder={`e.g. MI Road, ${city}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes or Description</label>
            <textarea
              rows={3}
              placeholder="Personal notes, dress code, or booking reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input
              type="checkbox"
              id="indoorCheck"
              checked={isIndoor}
              onChange={(e) => setIsIndoor(e.target.checked)}
            />
            <label htmlFor="indoorCheck" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              This is an indoor activity (Monsoon safe)
            </label>
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }}>
            Add to Itinerary
          </button>
        </form>
      </div>
    </div>
  );
}
