'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Car, 
  Volume2, 
  AlertOctagon, 
  CheckCircle, 
  MapPin, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';

export default function ScamShieldPage() {
  const [city, setCity] = useState('Delhi');
  const [distanceKm, setDistanceKm] = useState(8);
  const [quoteInput, setQuoteInput] = useState(350);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchFares = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scam-shield?city=${encodeURIComponent(city)}&km=${distanceKm}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, distanceKm]);

  // Web Speech API: Audio playback of native bargaining phrases
  const playAudioPhrase = (text: string, lang = 'hi-IN') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Audio reading: "${text}"`);
    }
  };

  const isOvercharging = data && quoteInput > data.fairPrice.autoMax;
  const excessPercent = data ? Math.round(((quoteInput - data.fairPrice.autoMax) / data.fairPrice.autoMax) * 100) : 0;

  return (
    <div className="container scam-page">
      <div className="page-header">
        <span className="badge badge-emerald">Real-Time Protection</span>
        <h1>Tourist Scam-Shield & Fair-Price Lens</h1>
        <p>Official state auto-rickshaw meter rates, common scam radar, and audio negotiation scripts.</p>
      </div>

      <div className="grid-2">
        {/* Fair Price Calculator */}
        <div className="glass-panel calc-card">
          <div className="calc-header">
            <Car className="text-saffron" size={24} />
            <h3>Auto & Taxi Fair-Fare Meter</h3>
          </div>

          <div className="form-group">
            <label className="form-label"><MapPin size={14} /> City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="form-select">
              <option value="Delhi">Delhi (NCT)</option>
              <option value="Jaipur">Jaipur (Rajasthan)</option>
              <option value="Varanasi">Varanasi (Uttar Pradesh)</option>
              <option value="Agra">Agra (Uttar Pradesh)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Distance: {distanceKm} km</label>
            <input 
              type="range" 
              min={1} 
              max={30} 
              value={distanceKm} 
              onChange={(e) => setDistanceKm(Number(e.target.value))} 
              className="range-input" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Driver's Quoted Price (₹)</label>
            <input 
              type="number" 
              value={quoteInput} 
              onChange={(e) => setQuoteInput(Number(e.target.value))} 
              className="form-input" 
            />
          </div>

          {data && (
            <div className="results-box">
              {isOvercharging ? (
                <div className="overcharge-warning animate-fade-in">
                  <AlertOctagon size={20} />
                  <div>
                    <strong>Overcharge Alert:</strong> Quoted price is ~{excessPercent}% higher than the official government tariff!
                  </div>
                </div>
              ) : (
                <div className="fair-badge animate-fade-in">
                  <CheckCircle size={20} />
                  <div><strong>Fair Quote:</strong> This quote is within official bounds.</div>
                </div>
              )}

              <div className="rates-table">
                <div className="rate-col">
                  <span className="rate-label">Fair Auto Meter</span>
                  <span className="rate-val">₹{data.fairPrice.autoMin} - ₹{data.fairPrice.autoMax}</span>
                </div>
                <div className="rate-col">
                  <span className="rate-label">AC Cab / Taxi</span>
                  <span className="rate-val">₹{data.fairPrice.taxiAcMin} - ₹{data.fairPrice.taxiAcMax}</span>
                </div>
              </div>

              <p className="local-advice">{data.localTips}</p>
            </div>
          )}
        </div>

        {/* Audio Negotiation Phrases */}
        <div className="glass-panel phrases-card">
          <div className="calc-header">
            <Volume2 className="text-emerald" size={24} />
            <h3>Local Dialect Polite Negotiation Helper</h3>
          </div>
          <p className="phrases-subtitle">Tap the speaker icon to play native pronunciation aloud to the driver or vendor.</p>

          <div className="phrases-list">
            {data?.bargainingPhrases?.map((p: any, idx: number) => (
              <div key={idx} className="phrase-item">
                <div className="phrase-top">
                  <strong>"{p.hindi}"</strong>
                  <button 
                    onClick={() => playAudioPhrase(p.hindi, 'hi-IN')}
                    className="btn btn-secondary btn-icon"
                    title="Play Audio"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <div className="phrase-eng">{p.english}</div>
                <div className="phrase-tip">💡 {p.tip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* City Common Scam Alerts */}
      {data && (
        <div className="scam-radar-section">
          <h2>Active Tourist Alert Radar: {city}</h2>
          <div className="grid-2">
            {data.commonScams.map((scam: any, i: number) => (
              <div key={i} className="glass-card scam-item-card">
                <div className="scam-title-row">
                  <ShieldAlert size={18} className="text-crimson" />
                  <h4>{scam.scamName}</h4>
                </div>
                <p className="scam-desc">{scam.description}</p>
                <div className="scam-prevention">
                  <strong>How to Avoid:</strong> {scam.howToAvoid}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
