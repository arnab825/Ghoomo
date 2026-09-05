'use client';

import React, { useState } from 'react';
import culturalRulesData from '@/data/cultural-rules.json';
import { BookOpen, AlertCircle, Camera, Check, Footprints, ShieldAlert } from 'lucide-react';

export default function EtiquettePage() {
  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);
  const activeRule = culturalRulesData[selectedSiteIndex];

  return (
    <div className="container etiquette-page">
      <div className="page-header">
        <span className="badge badge-saffron">Cultural Harmony & Respect</span>
        <h1>Sacred Site Etiquette & Taboo Advisor</h1>
        <p>Essential guidance on dress codes, footwear protocols, photography rules, and respectful behavior across Indian temples and spiritual sites.</p>
      </div>

      <div className="etiquette-layout">
        {/* Site Selector Tabs */}
        <div className="sites-sidebar">
          {culturalRulesData.map((rule, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSiteIndex(idx)}
              className={`site-tab-btn ${selectedSiteIndex === idx ? 'active' : ''}`}
            >
              <div className="tab-state">{rule.state}</div>
              <div className="tab-site">{rule.site}</div>
            </button>
          ))}
        </div>

        {/* Selected Site Details */}
        <div className="rules-content glass-panel">
          <div className="rules-header">
            <span className="badge badge-emerald">{activeRule.state}</span>
            <h2>{activeRule.site}</h2>
          </div>

          <div className="grid-2 rules-grid">
            {/* Attire Guidelines */}
            <div className="glass-card detail-card">
              <div className="detail-title-row">
                <Check size={20} className="text-emerald" />
                <h3>Recommended Dress Code</h3>
              </div>
              <div className="detail-item">
                <span className="label">Men:</span>
                <p>{activeRule.attire.men}</p>
              </div>
              <div className="detail-item">
                <span className="label">Women:</span>
                <p>{activeRule.attire.women}</p>
              </div>
            </div>

            {/* Footwear & Leather Protocol */}
            <div className="glass-card detail-card">
              <div className="detail-title-row">
                <Footprints size={20} className="text-saffron" />
                <h3>Footwear & Leather Policy</h3>
              </div>
              <p className="detail-body">{activeRule.attire.footwear}</p>
            </div>

            {/* Photography Guidelines */}
            <div className="glass-card detail-card">
              <div className="detail-title-row">
                <Camera size={20} className="text-cyan" />
                <h3>Photography & Media Rules</h3>
              </div>
              <p className="detail-body">{activeRule.photography}</p>
            </div>

            {/* Strict Taboos */}
            <div className="glass-card detail-card taboos-card">
              <div className="detail-title-row">
                <ShieldAlert size={20} className="text-crimson" />
                <h3>Strict Taboos & Cautions</h3>
              </div>
              <p className="detail-body">{activeRule.taboos}</p>
              <div className="customs-note">
                <strong>Respectful Practice:</strong> {activeRule.customs}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
