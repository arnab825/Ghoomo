export interface FeaturedCity {
  city: string;
  state: string;
  tagline: string;
  activitiesCount: string;
  imageUrl: string;
  weatherDefault: {
    temp: string;
    condition: string;
    highLow: string;
    icon: string;
  };
}

export const FEATURED_CITIES: FeaturedCity[] = [
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'Pink City, Royal Havelis & Amber Hilltop',
    activitiesCount: '35+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '28°C', condition: 'Sunny & Dry', highLow: '32° / 21°', icon: '☀️' },
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    tagline: 'Sacred Ganga Ghats, Sunrise Boats & Silk Weavers',
    activitiesCount: '28+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '29°C', condition: 'Warm & River Breeze', highLow: '33° / 22°', icon: '⛅' },
  },
  {
    city: 'Goa',
    state: 'Goa',
    tagline: 'Water Sports, Spice Farms & Portuguese Quarters',
    activitiesCount: '45+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '30°C', condition: 'Coastal Breeze & Sunny', highLow: '32° / 25°', icon: '🌊' },
  },
  {
    city: 'Agra',
    state: 'Uttar Pradesh',
    tagline: 'Taj Mahal at Dawn, Mughal Forts & Marble Inlay',
    activitiesCount: '22+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '27°C', condition: 'Pleasant & Clear', highLow: '31° / 20°', icon: '🌤️' },
  },
  {
    city: 'Kerala',
    state: 'Kerala',
    tagline: 'Alleppey Backwaters, Tea Plantations & Ayurveda',
    activitiesCount: '32+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '27°C', condition: 'Tropical Mist & Warm', highLow: '30° / 23°', icon: '🌴' },
  },
  {
    city: 'Delhi',
    state: 'Capital Region',
    tagline: 'Mughal Architecture, Spice Bazaars & Street Food',
    activitiesCount: '40+ experiences',
    imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    weatherDefault: { temp: '26°C', condition: 'Clear Sky', highLow: '30° / 19°', icon: '☀️' },
  },
];
