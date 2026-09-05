'use client';

import React from 'react';
import { X, Copy, Check, Phone } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  days: number;
  linkCopied: boolean;
  onCopyLink: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  city,
  days,
  linkCopied,
  onCopyLink,
}: ShareModalProps) {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out my ${days}-day smart travel plan for ${city} on Smart Tourism India: ${currentUrl}`
  )}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    `Travel Itinerary for ${city}`
  )}&body=${encodeURIComponent(
    `Here is our complete AI-crafted day-by-day travel plan for ${city}: ${currentUrl}`
  )}`;

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-content-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3>Share Your Itinerary</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-close-drawer"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Share your custom AI-powered plan for {city} with friends, family, or travel buddies.
        </p>

        {/* Copyable Link Field */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="form-input"
            style={{ fontSize: '0.85rem' }}
          />
          <button
            type="button"
            onClick={onCopyLink}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            {linkCopied ? <Check size={16} /> : <Copy size={16} />}
            <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Share via WhatsApp & Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-emerald w-full"
            style={{ justifyContent: 'center' }}
          >
            <Phone size={16} /> Share on WhatsApp
          </a>

          <a
            href={mailtoUrl}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            Share via Email
          </a>
        </div>
      </div>
    </div>
  );
}
