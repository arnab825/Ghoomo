'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CloudRain, 
  Languages, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Wallet,
  BedDouble,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  ExternalLink
} from 'lucide-react';
import destinationsData from '@/data/destinations.json';
import communityTripsData from '@/data/community-trips.json';

const featuredCities = [
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    activitiesCount: '35+ experiences',
    tagline: 'Pink City, Royal Havelis & Amber Hilltop',
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    activitiesCount: '28+ experiences',
    tagline: 'Sacred Ganga Ghats, Sunrise Boats & Silk Weavers',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Goa',
    state: 'Goa',
    activitiesCount: '45+ experiences',
    tagline: 'Water Sports, Spice Farms & Portuguese Quarters',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Agra',
    state: 'Uttar Pradesh',
    activitiesCount: '22+ experiences',
    tagline: 'Taj Mahal at Dawn, Mughal Forts & Marble Inlay',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Kerala',
    state: 'Kerala',
    activitiesCount: '32+ experiences',
    tagline: 'Alleppey Backwaters, Tea Plantations & Ayurveda',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  },
  {
    city: 'Delhi',
    state: 'Capital Region',
    activitiesCount: '40+ experiences',
    tagline: 'Mughal Architecture, Spice Bazaars & Street Food',
    imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState('Jaipur');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(12000);
  const [style, setStyle] = useState('balanced');

  const handleQuickPlan = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/itinerary?city=${encodeURIComponent(city)}&days=${days}&budget=${budget}&style=${style}`);
  };

  return (
    <div className="home-container">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HERO SECTION: Competitor NextDestination.ai Parity + AI Power   */}
      {/* ----------------------------------------------------------------- */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-badge animate-fade-in">
            <span className="badge badge-saffron">
              <Sparkles size={13} /> SIH26207 Smart Tourism Studio
            </span>
            <span className="hero-badge-text">100% Free Cloud • Reality-Aware AI Platform</span>
          </div>

          <h1 className="hero-title animate-fade-in">
            Plan your dream trip in minutes. <br />
            <span className="gradient-text-saffron">Personalized, Safe & Reality-Aware.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in">
            Unlike generic AI planners, works like your personal local concierge — giving you dynamic monsoon rerouting, 
            fair auto-rickshaw benchmarks, cultural dress-code alerts, and verified heritage homestays across India.
          </p>

          {/* Quick AI Trip Planner Card */}
          <div className="planner-card glass-panel animate-fade-in">
            <div className="planner-header">
              <h3>Plan Your AI Smart Trip Instantly</h3>
              <p>Tailored by Kaggle datasets, Gemini & Multi-LLM intelligence</p>
            </div>

            <form onSubmit={handleQuickPlan} className="planner-form">
              <div className="form-group">
                <label className="form-label"><MapPin size={15} /> Destination</label>
                <select 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  className="form-select"
                >
                  <option value="Jaipur">Jaipur (Pink City, Rajasthan)</option>
                  <option value="Varanasi">Varanasi (Kashi Ghats, UP)</option>
                  <option value="Goa">Goa (Beaches, Forts & Water Sports)</option>
                  <option value="Agra">Agra (Taj & Mughal Forts, UP)</option>
                  <option value="Kerala">Kerala (Backwaters & Hills)</option>
                  <option value="Delhi">Delhi (Historic Capital)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label"><Calendar size={15} /> Duration</label>
                <select 
                  value={days} 
                  onChange={(e) => setDays(Number(e.target.value))} 
                  className="form-select"
                >
                  <option value={2}>2 Days (Weekend Getaway)</option>
                  <option value={3}>3 Days (Recommended)</option>
                  <option value={5}>5 Days (Deep Exploration)</option>
                  <option value={7}>7 Days (Heritage Circuit)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label"><Wallet size={15} /> Total Budget</label>
                <select 
                  value={budget} 
                  onChange={(e) => setBudget(Number(e.target.value))} 
                  className="form-select"
                >
                  <option value={6000}>₹6,000 (Backpacker / Student)</option>
                  <option value={12000}>₹12,000 (Comfort Solo/Couple)</option>
                  <option value={25000}>₹25,000 (Family / Heritage)</option>
                  <option value={50000}>₹50,000 (Luxury Palace)</option>
                </select>
              </div>

              <div className="planner-submit">
                <button type="submit" className="btn btn-primary w-full" style={{ height: '44px' }}>
                  <Sparkles size={18} />
                  <span>Generate Plan</span>
                </button>
              </div>
            </form>
          </div>

          {/* Category Quick-Filter Icons Row (Matching NextDestination.ai) */}
          <div className="category-icons-row animate-fade-in">
            <Link href="/itinerary?city=Jaipur" className="category-icon-pill">
              <Compass size={16} className="text-saffron" />
              <span>AI Day Planner</span>
            </Link>
            <Link href="/marketplace" className="category-icon-pill">
              <BedDouble size={16} className="text-accent" />
              <span>Verified Havelis & Stays</span>
            </Link>
            <Link href="/scam-shield" className="category-icon-pill">
              <ShieldCheck size={16} className="text-emerald" />
              <span>Fair Auto Fare & Scam Shield</span>
            </Link>
            <Link href="/translator" className="category-icon-pill">
              <Languages size={16} className="text-cyan" />
              <span>Voice Translator</span>
            </Link>
            <Link href="/etiquette" className="category-icon-pill">
              <CheckCircle2 size={16} className="text-warning" />
              <span>Temple Dress Codes</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. "WHERE TO NEXT?" FEATURED DESTINATIONS (NextDestination Parity) */}
      {/* ----------------------------------------------------------------- */}
      <section className="container" style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-saffron" style={{ marginBottom: '0.5rem' }}>Popular Circuits</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Where to next?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Explore India's most celebrated heritage, spiritual, and coastal destinations.
            </p>
          </div>
          <Link href="/itinerary" className="feature-link">
            <span>Explore all circuits</span> <ArrowRight size={15} />
          </Link>
        </div>

        <div className="destinations-showcase-grid">
          {featuredCities.map((dest) => (
            <Link 
              key={dest.city} 
              href={`/itinerary?city=${encodeURIComponent(dest.city)}&days=3`}
              className="featured-dest-card"
            >
              <img src={dest.imageUrl} alt={dest.city} className="featured-dest-bg" />
              <div className="featured-dest-overlay" />
              <span className="featured-activity-badge">{dest.activitiesCount}</span>
              <div className="featured-dest-content">
                <h3>{dest.city}, {dest.state}</h3>
                <p>{dest.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. TRENDING COMMUNITY TRIPS (NextDestination.ai Parity)           */}
      {/* ----------------------------------------------------------------- */}
      <section className="container" style={{ marginTop: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '0.5rem' }}>Traveler Showcase</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Trending Trips by the Community</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Browse itineraries created by fellow travelers and customize them for your own journey.
            </p>
          </div>
          <Link href="/itinerary" className="feature-link">
            <span>Open AI Planner</span> <ArrowRight size={15} />
          </Link>
        </div>

        <div className="community-trips-grid">
          {communityTripsData.map((trip) => (
            <div key={trip.id} className="community-trip-card glass-panel">
              <img src={trip.coverImage} alt={trip.title} className="comm-trip-cover" />
              <div className="comm-trip-body">
                <h4>{trip.title}</h4>
                <div className="comm-trip-meta">
                  <span>📍 {trip.destination} • {trip.durationDays} Days</span>
                  <span>❤️ {trip.likes} likes</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.4rem 0' }}>
                  By {trip.author} • Category: <strong style={{ color: '#ffb86c' }}>{trip.category}</strong>
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {trip.highlights.slice(0, 2).map((h, hIdx) => (
                    <span key={hIdx} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {h}
                    </span>
                  ))}
                </div>
                <Link 
                  href={`/itinerary?city=${encodeURIComponent(trip.destination)}&days=${trip.durationDays}`}
                  className="btn btn-primary w-full"
                  style={{ fontSize: '0.82rem', padding: '0.5rem', marginTop: 'auto', textAlign: 'center', justifyContent: 'center' }}
                >
                  Clone & Customize Plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. OUR UNFAIR COMPETITIVE ADVANTAGES (What Competitor is Lacking)   */}
      {/* ----------------------------------------------------------------- */}
      <section className="features-section container">
        <div className="section-header">
          <span className="badge badge-emerald">Realities of Travel in India</span>
          <h2>What Other AI Travel Planners Miss</h2>
          <p>India-first intelligent safeguards engineered for domestic & international tourists.</p>
        </div>

        <div className="grid-3">
          <div className="glass-card feature-box">
            <div className="feature-icon saffron-bg">
              <CloudRain size={24} />
            </div>
            <h3>Dynamic Monsoon Rerouting</h3>
            <p>
              Sudden cloudburst at 2 PM? While competitors show static weather, our AI dynamically swaps waterlogged 
              outdoor battlements with covered royal palaces and indoor artisan studios in real time.
            </p>
            <Link href="/itinerary" className="feature-link">
              Try Reroute Simulator <ArrowRight size={14} />
            </Link>
          </div>

          <div className="glass-card feature-box">
            <div className="feature-icon emerald-bg">
              <ShieldCheck size={24} />
            </div>
            <h3>Fair-Fare & Scam Shield</h3>
            <p>
              Auto-rickshaw meter rate calculator based on official state transport tariffs (₹12/km). 
              Equipped with regional dialect phrases to eliminate tout exploitation at railway stations.
            </p>
            <Link href="/scam-shield" className="feature-link">
              Open Fair-Price Lens <ArrowRight size={14} />
            </Link>
          </div>

          <div className="glass-card feature-box">
            <div className="feature-icon cyan-bg">
              <Languages size={24} />
            </div>
            <h3>Bhashini Voice Translator</h3>
            <p>
              Real-time voice and text translator across 10 Indian regional languages (Hindi, Tamil, Bengali, Telugu, Marathi) 
              to negotiate with drivers and shopkeepers with natural audio playback.
            </p>
            <Link href="/translator" className="feature-link">
              Launch Voice Concierge <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
