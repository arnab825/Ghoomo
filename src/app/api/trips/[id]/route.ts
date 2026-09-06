import { NextRequest, NextResponse } from 'next/server';
import { getServerTripById, saveServerTrip, deleteServerTrip } from '@/lib/server/tripStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = await getServerTripById(id);

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const tripData = body.trip || body;

    const saved = await saveServerTrip({ ...tripData, id });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update trip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteServerTrip(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete trip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
