import { PlatformType, Place } from '@/lib/types/ghoomo';

export interface SampleReelBundle {
  id: string;
  url: string;
  platform: PlatformType;
  title: string;
  author: string;
  thumbnailUrl: string;
  destination: string;
  places: Omit<Place, 'id' | 'tripId' | 'sourceId' | 'createdAt'>[];
}

// All mock data removed. Ghoomo only processes live video links with voice transcripts.
export const SAMPLE_VIRAL_REELS: SampleReelBundle[] = [];
