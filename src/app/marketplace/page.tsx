'use client';

import React, { useState } from 'react';
import homestaysData from '@/data/homestays.json';
import { Store, ShieldCheck, Phone, QrCode, Star, CheckCircle } from 'lucide-react';
import { HomestayListing } from '@/types';

export default function MarketplacePage() {
  const [filter, setFilter] = useState<'all' | 'homestay' | 'artisan' | 'guide'>('all');
  const [listings] = useState<HomestayListing[]>(homestaysData as any);
  const [selectedListing, setSelectedListing] = useState<HomestayListing | null>(null);

  const filtered = filter === 'all' ? listings : listings.filter((l) => l.category === filter);

  return (
    <div className="container marketplace-page">
      <div className="page-header">
        <div>
          <span className="badge badge-emerald">ONDC-Style Verified Network</span>
          <h1>Verified Homestays & Master Artisans</h1>
          <p>Zero-middleman direct contact and fair price transparency for authentic Indian travel.</p>
        </div>

        <div className="filter-tabs">
          <button 
            onClick={() => setFilter('all')} 
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          >
            All Listings
          </button>
          <button 
            onClick={() => setFilter('homestay')} 
            className={`tab-btn ${filter === 'homestay' ? 'active' : ''}`}
          >
            Rural Homestays
          </button>
          <button 
            onClick={() => setFilter('artisan')} 
            className={`tab-btn ${filter === 'artisan' ? 'active' : ''}`}
          >
            GI-Tag Artisans
          </button>
          <button 
            onClick={() => setFilter('guide')} 
            className={`tab-btn ${filter === 'guide' ? 'active' : ''}`}
          >
            Certified Guides
          </button>
        </div>
      </div>

      <div className="grid-3">
        {filtered.map((item) => (
          <div key={item.id} className="glass-card listing-card">
            <div className="listing-top">
              <span className="badge badge-saffron">{item.category.toUpperCase()}</span>
              {item.isVerified && (
                <span className="badge badge-emerald">
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
            </div>

            <h3 className="listing-title">{item.title}</h3>
            <div className="listing-location">📍 {item.city}, {item.state}</div>
            <p className="listing-desc">{item.description}</p>

            <div className="listing-badges">
              {item.badges?.map((b, i) => (
                <span key={i} className="mini-badge">✓ {b}</span>
              ))}
            </div>

            <div className="listing-footer">
              <div className="price-tag">
                <span className="price-val">₹{item.pricePerUnit}</span>
                <span className="price-unit">/{item.unitType}</span>
              </div>

              <button 
                onClick={() => setSelectedListing(item)} 
                className="btn btn-emerald"
              >
                <QrCode size={16} />
                <span>Contact / Pay</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Contact & UPI Modal */}
      {selectedListing && (
        <div className="modal-backdrop" onClick={() => setSelectedListing(null)}>
          <div className="glass-panel modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedListing.title}</h3>
              <button onClick={() => setSelectedListing(null)} className="close-btn">✕</button>
            </div>

            <div className="modal-content">
              <p className="modal-note">
                Direct engagement without third-party commissions. 100% of your money goes directly to the local host or artisan family.
              </p>

              <div className="contact-info-block">
                <div className="contact-row">
                  <Phone size={18} className="text-saffron" />
                  <div>
                    <span className="label">Direct Host Contact:</span>
                    <strong>{selectedListing.contactNumber}</strong>
                  </div>
                </div>

                <div className="contact-row">
                  <QrCode size={18} className="text-emerald" />
                  <div>
                    <span className="label">Direct UPI Virtual ID:</span>
                    <strong>{selectedListing.upiId}</strong>
                  </div>
                </div>
              </div>

              <div className="upi-demo-box">
                <div className="upi-qr-placeholder">
                  [ UPI QR Code ]
                </div>
                <p>Scan with Google Pay, PhonePe, or Paytm</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
