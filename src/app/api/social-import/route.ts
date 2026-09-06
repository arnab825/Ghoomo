import { NextRequest, NextResponse } from 'next/server';
import { extractLocationsFromSocialUrl } from '@/features/social-import/extractors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'A valid URL string is required' },
        { status: 400 }
      );
    }

    const result = await extractLocationsFromSocialUrl(url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract locations from social URL';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
