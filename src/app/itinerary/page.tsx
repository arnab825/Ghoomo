'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { ItineraryPlan, ActivityItem, ItineraryDay, HomestayListing } from '@/types';
import homestaysData from '@/data/homestays.json';
import communityTripsData from '@/data/community-trips.json';
import activitiesCatalog from '@/data/activities-catalog.json';

// Subcomponents
import { TripTopBar } from '@/components/itinerary/TripTopBar';
import { DayNavigator } from '@/components/itinerary/DayNavigator';
import { DayTimeline } from '@/components/itinerary/DayTimeline';
import { MapPreview } from '@/components/itinerary/MapPreview';
import { HotelDrawer } from '@/components/itinerary/HotelDrawer';
import { ActivityDrawer } from '@/components/itinerary/ActivityDrawer';
import { CustomActivityModal } from '@/components/itinerary/CustomActivityModal';
import { ShareModal } from '@/components/itinerary/ShareModal';
import { CommunityTripsModal } from '@/components/itinerary/CommunityTripsModal';
import { InfographicView } from '@/components/itinerary/InfographicView';

// Live Weather Lookup Matrix for Top Indian Destinations
const WEATHER_MATRIX: Record<string, { temp: string; condition: string; highLow: string; icon: string }> = {
  Jaipur: { temp: '28°C', condition: 'Sunny & Dry', highLow: '32° / 21°', icon: '☀️' },
  Varanasi: { temp: '29°C', condition: 'Warm & River Breeze', highLow: '33° / 22°', icon: '⛅' },
  Agra: { temp: '27°C', condition: 'Pleasant & Clear', highLow: '31° / 20°', icon: '🌤️' },
  Delhi: { temp: '26°C', condition: 'Clear Sky', highLow: '30° / 19°', icon: '☀️' },
  Goa: { temp: '30°C', condition: 'Coastal Breeze & Sunny', highLow: '32° / 25°', icon: '🌊' },
  Kerala: { temp: '27°C', condition: 'Tropical Mist & Warm', highLow: '30° / 23°', icon: '🌴' },
};

function ItineraryPlanner() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || 'Jaipur';
  const initialDays = Number(searchParams.get('days') || 3);
  const initialBudget = Number(searchParams.get('budget') || 12000);
  const initialStyle = searchParams.get('style') || 'balanced';

  // Core Trip Parameters
  const [city, setCity] = useState(initialCity);
  const [days, setDays] = useState(initialDays);
  const [budget, setBudget] = useState(initialBudget);
  const [style, setStyle] = useState(initialStyle);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // View Mode: 'timeline' or 'infographic'
  const [viewMode, setViewMode] = useState<'timeline' | 'infographic'>('timeline');

  // Loading & Itinerary State
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);

  // Reality-Aware Monsoon Simulator State
  const [rerouting, setRerouting] = useState(false);
  const [weatherAlertActive, setWeatherAlertActive] = useState(false);
  const [rerouteNotice, setRerouteNotice] = useState<string | null>(null);

  // Modals & Drawers Visibility
  const [isHotelDrawerOpen, setIsHotelDrawerOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  // Search Filters
  const [hotelSearch, setHotelSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('All');
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('All');

  // Link copy feedback
  const [linkCopied, setLinkCopied] = useState(false);

  // Map display toggle
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Error feedback state
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch Plan from Multi-LLM API
  // ---------------------------------------------------------------------------
  const fetchPlan = async () => {
    setLoading(true);
    setFetchError(null);
    setWeatherAlertActive(false);
    setRerouteNotice(null);
    try {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: city,
          durationDays: days,
          budget: budget,
          travelStyle: style,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setItinerary(data.data);
        setSelectedDayIndex(0);
      } else {
        setFetchError(data?.error || 'Unable to generate your itinerary. Please try again.');
      }
    } catch (e) {
      console.error('[Client Itinerary] Network or runtime error:', e);
      setFetchError('A connection error occurred while generating your itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Reality Simulator: Sudden Monsoon Rerouting
  // ---------------------------------------------------------------------------
  const handleTriggerWeatherAlert = async () => {
    if (!itinerary || !itinerary.days.length) return;
    setRerouting(true);
    try {
      const res = await fetch('/api/reroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: city,
          reason: 'rain',
          currentDay: selectedDayIndex + 1,
          currentTime: '14:00',
          currentActivityTitle: itinerary.days[selectedDayIndex]?.activities[0]?.title || 'Outdoor Sight',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedDays = [...itinerary.days];
        const currentActivities = updatedDays[selectedDayIndex].activities;
        updatedDays[selectedDayIndex].activities = [
          ...data.suggestedAlternatives,
          currentActivities[currentActivities.length - 1],
        ];
        updatedDays[selectedDayIndex].theme = '⛈️ Monsoon Reality Adaptation: Covered Palaces & Artisans';

        setItinerary({
          ...itinerary,
          days: updatedDays,
        });
        setWeatherAlertActive(true);
        setRerouteNotice(`Monsoon surge detected in ${city}. Outdoor sights swapped with covered museums and artisan workshops!`);
      }
    } catch (e) {
      console.error('Reroute failed:', e);
    } finally {
      setRerouting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Action Handlers (Adding, Deleting, Reordering, Cloning)
  // ---------------------------------------------------------------------------
  const handleOptimizeRoute = () => {
    if (!itinerary || !itinerary.days[selectedDayIndex]) return;
    const currentActivities = [...itinerary.days[selectedDayIndex].activities];
    currentActivities.sort((a, b) => a.time.localeCompare(b.time));
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDayIndex].activities = currentActivities;
    setItinerary({ ...itinerary, days: updatedDays });
  };

  const handleAddCustomActivity = (custom: {
    title: string;
    time: string;
    location: string;
    estimatedCost: number;
    type: string;
    description: string;
    isIndoor: boolean;
  }) => {
    if (!itinerary) return;
    const newAct: ActivityItem = {
      ...custom,
      imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(custom.title + ' ' + city)}`,
    };
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDayIndex].activities.push(newAct);
    setItinerary({ ...itinerary, days: updatedDays });
  };

  const handleDeleteActivity = (actIndex: number) => {
    if (!itinerary) return;
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDayIndex].activities.splice(actIndex, 1);
    setItinerary({ ...itinerary, days: updatedDays });
  };

  const handleAddHotelToDay = (hotel: HomestayListing) => {
    if (!itinerary) return;
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDayIndex].hotel = {
      id: hotel.id,
      title: hotel.title,
      pricePerUnit: hotel.pricePerUnit,
      rating: hotel.rating,
      imageUrl: hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      description: hotel.description,
    };
    setItinerary({ ...itinerary, days: updatedDays });
    setIsHotelDrawerOpen(false);
  };

  const handleAddActivityToDay = (act: any) => {
    if (!itinerary) return;
    const newAct: ActivityItem = {
      title: act.title,
      time: '03:00 PM - 05:00 PM',
      location: `${act.city}, India`,
      estimatedCost: act.price,
      type: act.category.toLowerCase().replace(/\s+/g, '_'),
      description: act.description,
      isIndoor: false,
      imageUrl: act.imageUrl,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(act.title + ' ' + act.city)}`,
      etiquetteTip: 'Book in advance through verified official desks.',
    };
    const updatedDays = [...itinerary.days];
    updatedDays[selectedDayIndex].activities.push(newAct);
    setItinerary({ ...itinerary, days: updatedDays });
    setIsActivityDrawerOpen(false);
  };

  const handleAddNewDay = () => {
    if (!itinerary) return;
    const newDayNumber = itinerary.days.length + 1;
    const newDay: ItineraryDay = {
      dayNumber: newDayNumber,
      theme: `Day ${newDayNumber}: Local Explorations & Hidden Gems`,
      activities: [
        {
          time: '09:30 AM - 12:30 PM',
          title: `${city} Heritage Discovery`,
          location: city,
          type: 'heritage',
          estimatedCost: 250,
          description: `Morning exploration of historic landmarks in ${city}.`,
          isIndoor: false,
          imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
          googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(city + ' Landmark')}`,
        },
      ],
    };
    setItinerary({
      ...itinerary,
      durationDays: newDayNumber,
      days: [...itinerary.days, newDay],
    });
    setSelectedDayIndex(newDayNumber - 1);
  };

  const handleCloneCommunityTrip = (trip: any) => {
    setCity(trip.destination);
    setDays(trip.durationDays);
    setBudget(trip.budgetTotal);
    setStyle(trip.travelStyle);
    setItinerary({
      destination: trip.destination,
      durationDays: trip.durationDays,
      budgetTotal: trip.budgetTotal,
      travelStyle: trip.travelStyle,
      days: trip.days,
      fairExpenseEstimate: {
        stay: Math.round(trip.budgetTotal * 0.4),
        transport: Math.round(trip.budgetTotal * 0.2),
        food: Math.round(trip.budgetTotal * 0.25),
        activities: Math.round(trip.budgetTotal * 0.15),
      },
      scamAlerts: [
        'Insist on meter or official prepaid taxi booth at arrivals',
        'Avoid unauthorized guides outside monument ticket counters',
      ],
    });
    setSelectedDayIndex(0);
    setIsCommunityModalOpen(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  // Weather data
  const weather = WEATHER_MATRIX[city] || {
    temp: '27°C',
    condition: 'Pleasant Weather',
    highLow: '30° / 22°',
    icon: '🌤️',
  };

  const currentDay = itinerary?.days[selectedDayIndex];

  // Filtered lists
  const filteredHotels = (homestaysData as HomestayListing[]).filter((h) => {
    const matchesCity = !city || h.city.toLowerCase() === city.toLowerCase();
    const matchesSearch = !hotelSearch || h.title.toLowerCase().includes(hotelSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const filteredActivities = activitiesCatalog.filter((a) => {
    const matchesCategory = activityCategoryFilter === 'All' || a.category === activityCategoryFilter;
    const matchesSearch = !activitySearch || a.title.toLowerCase().includes(activitySearch.toLowerCase()) || a.city.toLowerCase().includes(activitySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCommunityTrips = communityTripsData.filter((t) => {
    return communityCategoryFilter === 'All' || t.category === communityCategoryFilter;
  });

  return (
    <div className="container" style={{ paddingBottom: '5rem', paddingTop: '1.5rem' }}>
      {/* 1. Top Bar */}
      <TripTopBar
        city={city}
        weather={weather}
        style={style}
        onSelectStyle={setStyle}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'timeline' ? 'infographic' : 'timeline')}
        onOptimizeRoute={handleOptimizeRoute}
        onOpenCommunity={() => setIsCommunityModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onDownloadPdf={() => window.print()}
        onSimulateMonsoon={handleTriggerWeatherAlert}
        weatherAlertActive={weatherAlertActive}
        rerouting={rerouting}
      />

      {/* 2. Reroute Banner */}
      {rerouteNotice && (
        <div className="reroute-banner animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} className="text-warning" />
          <div className="banner-text">
            <strong>Dynamic Reality Adaptation:</strong> {rerouteNotice}
          </div>
        </div>
      )}

      {/* 3. Main Views */}
      {viewMode === 'infographic' && itinerary ? (
        <InfographicView
          city={city}
          style={style}
          itinerary={itinerary}
          onBackToEditor={() => setViewMode('timeline')}
        />
      ) : (
        <div className="studio-workspace-grid">
          {/* Left Column: Day Navigator */}
          <DayNavigator
            days={itinerary?.days || []}
            selectedDayIndex={selectedDayIndex}
            onSelectDayIndex={setSelectedDayIndex}
            onAddDay={handleAddNewDay}
            fairExpenseEstimate={itinerary?.fairExpenseEstimate}
          />

          {/* Center Column: Timeline */}
          {loading ? (
            <div className="loading-state glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <RefreshCw size={36} className="animate-spin text-saffron" style={{ margin: '0 auto 1rem auto' }} />
              <h3>Crafting Your Smart Itinerary...</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Coordinating multi-tier AI models, weather forecasts, and certified government rates.
              </p>
            </div>
          ) : currentDay ? (
            <DayTimeline
              city={city}
              currentDay={currentDay}
              onOpenHotelDrawer={() => setIsHotelDrawerOpen(true)}
              onDeleteActivity={handleDeleteActivity}
              onOpenCustomModal={() => setIsCustomModalOpen(true)}
              onOpenActivityDrawer={() => setIsActivityDrawerOpen(true)}
            />
          ) : fetchError ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <div style={{ color: '#f87171', marginBottom: '1rem', display: 'inline-flex' }}>
                <AlertTriangle size={36} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Unable to Load Itinerary</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                {fetchError}
              </p>
              <button
                onClick={fetchPlan}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : null}

          {/* Right Column: Map Preview */}
          <MapPreview
            city={city}
            currentDay={currentDay}
            mapType={mapType}
            onToggleMapType={setMapType}
          />
        </div>
      )}

      {/* 4. Sliding Drawers & Modals */}
      <HotelDrawer
        isOpen={isHotelDrawerOpen}
        onClose={() => setIsHotelDrawerOpen(false)}
        city={city}
        hotels={filteredHotels}
        searchQuery={hotelSearch}
        onSearchChange={setHotelSearch}
        onAddHotel={handleAddHotelToDay}
      />

      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        onClose={() => setIsActivityDrawerOpen(false)}
        activities={filteredActivities}
        searchQuery={activitySearch}
        onSearchChange={setActivitySearch}
        categoryFilter={activityCategoryFilter}
        onCategoryFilterChange={setActivityCategoryFilter}
        onAddActivity={handleAddActivityToDay}
      />

      <CustomActivityModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        city={city}
        onAddCustomActivity={handleAddCustomActivity}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        city={city}
        days={days}
        linkCopied={linkCopied}
        onCopyLink={handleCopyLink}
      />

      <CommunityTripsModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        trips={filteredCommunityTrips}
        categoryFilter={communityCategoryFilter}
        onCategoryFilterChange={setCommunityCategoryFilter}
        onCloneTrip={handleCloneCommunityTrip}
      />
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>Loading AI Travel Studio...</div>}>
      <ItineraryPlanner />
    </Suspense>
  );
}
