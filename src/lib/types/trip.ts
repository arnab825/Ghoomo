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

export interface ItineraryPlan {
  id?: string;
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

export interface SavedTrip {
  id: string;
  userId?: string;
  title: string;
  city: string;
  daysCount: number;
  totalBudget: number;
  travelStyle: string;
  plan: ItineraryPlan;
  status: 'planned' | 'ongoing' | 'completed';
  createdAt: string;
  updatedAt: string;
}
