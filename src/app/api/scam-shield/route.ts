import { NextResponse } from 'next/server';
import fairRatesData from '@/data/fair-rates.json';
import { ScamShieldRequestSchema } from '@/schemas/itinerary';
import { handleApiError } from '@/lib/security/errorHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramsObj = Object.fromEntries(searchParams.entries());

    const validation = ScamShieldRequestSchema.safeParse(paramsObj);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid scam-shield query parameters',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { city, km } = validation.data;
    const cityInfo = (fairRatesData.cities as Record<string, any>)[city];

    if (!cityInfo) {
      return NextResponse.json(
        { error: `No fare rate data available for city: ${city}` },
        { status: 404 }
      );
    }

    const autoRate = cityInfo.autoFare;
    const taxiRate = cityInfo.taxiAcFare;

    const calculatedAutoFare = Math.round(
      autoRate.baseRate + Math.max(0, km - autoRate.baseKm) * autoRate.perKmAfter
    );

    const calculatedTaxiFare = Math.round(
      taxiRate.baseRate + Math.max(0, km - taxiRate.baseKm) * taxiRate.perKmAfter
    );

    return NextResponse.json({
      success: true,
      city,
      distanceKm: km,
      fairPrice: {
        autoMin: calculatedAutoFare,
        autoMax: Math.round(calculatedAutoFare * 1.2),
        taxiAcMin: calculatedTaxiFare,
        taxiAcMax: Math.round(calculatedTaxiFare * 1.25),
        nightSurchargePercent: autoRate.nightSurchargePercent,
      },
      localTips: autoRate.tips,
      commonScams: cityInfo.commonScams,
      bargainingPhrases: fairRatesData.bargainingPhrases,
    });
  } catch (error: any) {
    return handleApiError(
      error,
      'GET /api/scam-shield',
      'An unexpected error occurred while calculating fair transport rates. Please try again later.'
    );
  }
}
