/**
 * Shared Type Definitions for Smart Tourism India (SIH26207)
 * 
 * Beginner Note:
 * In TypeScript, "interfaces" act like contracts that define the shape of objects.
 * When a function expects an "ItineraryPlan", TypeScript will ensure that object
 * has destination, days, budget, etc.
 */

// Represents a tourist spot or heritage landmark (from Kaggle dataset)
export interface Destination {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  timings: string;
  entryFee: {
    indian: number;
    foreigner: number;
    saarc: number;
  };
  bestTimeToVisit: string;
  idealDurationHours: number;
  scamWarning: string;
  culturalEtiquette: string;
}

// Represents a verified local homestay, rural artisan, or licensed guide
export interface HomestayListing {
  id: string;
  title: string;
  category: 'homestay' | 'artisan' | 'guide' | 'experience';
  city: string;
  state: string;
  pricePerUnit: number;
  unitType: string;
  rating: number;
  isVerified: boolean;
  contactNumber: string;
  upiId: string;
  description: string;
  badges: string[];
  imageUrl?: string;
}

// Represents a single activity or stop inside a travel day
export interface ActivityItem {
  time: string;
  title: string;
  location: string;
  type: string;
  estimatedCost: number;
  description: string;
  etiquetteTip?: string;
  isIndoor?: boolean;
  imageUrl?: string;
  googleMapsUrl?: string;
}

// Represents a single day in an itinerary with a theme and list of activities
export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  hotel?: {
    id?: string;
    title: string;
    pricePerUnit: number;
    rating: number;
    imageUrl?: string;
    description?: string;
  };
  activities: ActivityItem[];
}

// Represents the complete AI-generated travel plan
export interface ItineraryPlan {
  destination: string;
  durationDays: number;
  budgetTotal: number;
  travelStyle: string;
  days: ItineraryDay[];
  fairExpenseEstimate: {
    stay: number;
    transport: number;
    food: number;
    activities: number;
  };
  scamAlerts: string[];
}

// Represents state-specific cultural etiquette, dress codes, and customs
export interface CulturalRule {
  state: string;
  site: string;
  attire: {
    men: string;
    women: string;
    footwear: string;
  };
  photography: string;
  customs: string;
  taboos: string;
}
