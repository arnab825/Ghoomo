'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAddPlaceMutation } from '@/hooks/useTripQueries';
import { Button } from '@/components/ui/button';
import { X, MapPin, Plus, Sparkles } from 'lucide-react';

interface AddPlaceModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
}

const POPULAR_PRESETS: Record<string, { city: string; state: string; lat: number; lng: number }> = {
  'Amber Palace Sun Terrace': { city: 'Jaipur', state: 'Rajasthan', lat: 26.9855, lng: 75.8513 },
  'Hawa Mahal Wind Windows': { city: 'Jaipur', state: 'Rajasthan', lat: 26.9239, lng: 75.8267 },
  'Dashashwamedh Evening Aarti': { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3076, lng: 83.0107 },
  'Palolem Beach Silent Noise': { city: 'South Goa', state: 'Goa', lat: 15.0099, lng: 74.0232 },
  'Solang Valley Ski Slope': { city: 'Manali', state: 'Himachal Pradesh', lat: 32.3167, lng: 77.1583 },
  'Pangong Tso Blue Waters': { city: 'Leh', state: 'Ladakh', lat: 33.7595, lng: 78.6674 },
};

export default function AddPlaceModal({ tripId, isOpen, onClose, defaultCity = 'Jaipur' }: AddPlaceModalProps) {
  const addPlaceMutation = useAddPlaceMutation(tripId);
  const [name, setName] = useState('');
  const [city, setCity] = useState(defaultCity.split(',')[0].trim());
  const [stateName, setStateName] = useState('India');
  const [lat, setLat] = useState('26.9124');
  const [lng, setLng] = useState('75.7873');
  const [category, setCategory] = useState('attraction');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleApplyPreset = (presetName: string) => {
    const p = POPULAR_PRESETS[presetName];
    if (p) {
      setName(presetName);
      setCity(p.city);
      setStateName(p.state);
      setLat(p.lat.toString());
      setLng(p.lng.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;

    setIsSubmitting(true);
    try {
      await addPlaceMutation.mutateAsync({
        name,
        city,
        state: stateName,
        lat: parseFloat(lat) || 26.9124,
        lng: parseFloat(lng) || 75.7873,
        category,
        confidence: 1.0, // Manual additions have 100% confidence
        isManual: true,
        imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
        notes: notes || 'Manually added to itinerary radar',
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{ zIndex: 99999 }}
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 space-y-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-600 border border-teal-200 dark:bg-teal-500/15 dark:text-teal-400 dark:border-teal-500/30">
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading dark:text-white">
                Add Place to <span className="text-teal-600 dark:text-teal-400">Map Radar</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add a custom landmark, café, secret viewpoint, or stop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all duration-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Sparkles size={12} className="text-orange-500" /> Popular Landmarks (Click to fill):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(POPULAR_PRESETS).map((pName) => (
              <button
                key={pName}
                type="button"
                onClick={() => handleApplyPreset(pName)}
                className="text-[10px] bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 px-2 py-1 rounded-sm border border-slate-200 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Place Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nahargarh Fort Sunset Point"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">State / Region</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Latitude *</label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Longitude *</label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none enabled:cursor-pointer disabled:cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            >
              <option value="attraction">Attraction / Monument</option>
              <option value="food">Restaurant / Food / Cafe</option>
              <option value="hotel">Hotel / Stay</option>
              <option value="activity">Adventure / Activity</option>
              <option value="nightlife">Nightlife / Evening</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tips / Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Recommended for early morning; entry ticket cash only"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:focus:ring-teal-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs py-2.5 rounded-md cursor-pointer active:scale-[0.98] transition-all duration-100 shadow-xs"
          >
            Add Place to Map & Itinerary
          </Button>
        </form>
      </div>
    </div>,
    document.body
  );
}
