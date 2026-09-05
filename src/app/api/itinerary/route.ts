import { NextResponse } from 'next/server';
import { ItineraryRequestSchema } from '@/schemas/itinerary';
import { generateItineraryAI } from '@/lib/ai';
import { handleApiError } from '@/lib/security/errorHandler';

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

    const validationResult = ItineraryRequestSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid itinerary request parameters',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const itinerary = await generateItineraryAI(validationResult.data);
    return NextResponse.json({ success: true, data: itinerary });
  } catch (error: any) {
    return handleApiError(
      error,
      'POST /api/itinerary',
      'An unexpected error occurred while generating your travel itinerary. Please try again later.'
    );
  }
}
