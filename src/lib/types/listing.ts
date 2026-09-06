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
  upiId?: string;
  description: string;
  badges: string[];
  imageUrl?: string;
}

export interface HostInquiry {
  id?: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  dates: string;
  guestsCount: number;
  message?: string;
  createdAt?: string;
}
