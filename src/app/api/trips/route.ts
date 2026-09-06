import { NextRequest, NextResponse } from 'next/server';
import { getServerTrips, saveServerTrip, saveMultipleServerTrips, deleteAllServerTrips } from '@/lib/server/tripStore';

export async function GET() {
  try {
    const trips = await getServerTrips();
    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trips';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.trips && Array.isArray(body.trips)) {
      const saved = await saveMultipleServerTrips(body.trips);
      return NextResponse.json({ success: true, data: saved });
    }

    const trip = body.trip || body;
    if (!trip || !trip.id) {
      return NextResponse.json({ success: false, error: 'Trip object with id is required' }, { status: 400 });
    }

    const saved = await saveServerTrip(trip);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save trip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteAllServerTrips();
    return NextResponse.json({ success: true, message: 'All trips deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete all trips';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
