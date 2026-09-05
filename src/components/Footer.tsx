'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Heart, ShieldCheck, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="container footer-content">
        <div className="footer-top">
          <div className="footer-info">
            <div className="footer-brand">
              <Compass className="text-saffron" size={20} />
              <span className="footer-title">BharatSmartTour (SIH26207)</span>
            </div>
            <p className="footer-tagline">
              Discover India, Every Step of the Way. A trust-first AI tourism web platform uniting personalized planning, scam prevention, cultural etiquette, and authentic artisan discovery.
            </p>
          </div>

          <div className="footer-links-group">
            <h4>Core Portals</h4>
            <Link href="/itinerary">AI Smart Planner</Link>
            <Link href="/scam-shield">Fair Price & Scam Shield</Link>
            <Link href="/marketplace">Verified Rural Homestays</Link>
            <Link href="/etiquette">Sacred Site Etiquette</Link>
          </div>

          <div className="footer-links-group">
            <h4>Grand Finale USPs</h4>
            <Link href="/translator">Bhashini Regional Voice</Link>
            <Link href="/group-collab">Group Voting & Split Bill</Link>
            <Link href="/marketplace">ONDC-style Artisan Directory</Link>
            <Link href="/auth">Vendor Onboarding</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 BharatSmartTour • Smart India Hackathon Prototype (SIH26207)</p>
          <div className="footer-badges">
            <span className="badge badge-saffron">
              <Award size={12} /> SIH 2026 Finale Ready
            </span>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} /> 100% Free Tier Cloud Stack
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

