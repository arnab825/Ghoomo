import { NextResponse } from 'next/server';
import { DynamicRerouteSchema } from '@/schemas/itinerary';
import { handleApiError } from '@/lib/security/errorHandler';

const INDOOR_ALTERNATIVES: Record<string, any[]> = {
  rain: [
    {
      time: '02:00 PM - 05:00 PM',
      title: 'State Heritage Museum & Art Gallery',
      location: 'Indoor Air-Conditioned Complex',
      type: 'indoor_museum',
      estimatedCost: 150,
      description: 'Monsoon-safe alternative: Explore ancient manuscripts, miniature paintings, and royal armor safely indoors.',
      isIndoor: true,
      imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80',
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=City+Palace+Museum+Jaipur',
      swapReason: 'Outdoor gardens closed due to sudden rain showers.'
    },
    {
      time: '05:30 PM - 07:30 PM',
      title: 'Cultural Dance & Puppet Auditorium Show',
      location: 'City Heritage Center',
      type: 'indoor_museum',
      estimatedCost: 300,
      description: 'Covered seating traditional Rajasthani/Kathak performance with live sarangi music.',
      isIndoor: true,
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Ravindra+Manch+Jaipur',
      swapReason: 'Evening outdoor walking tour rerouted to cultural hall.'
    }
  ],
  delay: [
    {
      time: '03:45 PM - 05:15 PM',
      title: 'Streamlined Monument Highlights Walk',
      location: 'Fast-track Route',
      type: 'heritage',
      estimatedCost: 100,
      description: 'Recalibrated 90-minute express circuit preserving remaining evening sunset views without exhaustion.',
      isIndoor: false,
      imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f445b988?auto=format&fit=crop&w=800&q=80',
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Hawa+Mahal+Jaipur',
      swapReason: 'Schedule adjusted for 45-minute transit delay.'
    }
  ]
};

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    const validation = DynamicRerouteSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid reroute input', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { reason, currentActivityTitle } = validation.data;
    const alternatives = INDOOR_ALTERNATIVES[reason] || INDOOR_ALTERNATIVES.rain;

    return NextResponse.json({
      success: true,
      message: `Successfully rebalanced schedule for condition: ${reason}`,
      originalActivity: currentActivityTitle,
      suggestedAlternatives: alternatives
    });
  } catch (err: any) {
    return handleApiError(
      err,
      'POST /api/reroute',
      'An unexpected error occurred while rebalancing your schedule. Please try again later.'
    );
  }
}
