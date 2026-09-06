import fairRatesData from '@/data/fair-rates.json';
import { ScamAlert, BargainPhrase } from '@/lib/types';

interface CityFareConfig {
  autoFare: {
    baseRate: number;
    baseKm: number;
    perKmAfter: number;
    nightSurchargePercent?: number;
    tips: string;
  };
  taxiAcFare: {
    baseRate: number;
    baseKm: number;
    perKmAfter: number;
  };
  commonScams: Array<{
    scamName: string;
    description: string;
    howToAvoid: string;
    fairPriceRef?: string;
  }>;
}

const rawCities = (fairRatesData as any).cities as Record<string, CityFareConfig>;

export function getFairPriceCalculation(
  city: string,
  km: number,
  isNight = false
) {
  const normalizedCity =
    Object.keys(rawCities).find((c) => c.toLowerCase() === city.toLowerCase()) || 'Delhi';
  const cityConfig = rawCities[normalizedCity] || rawCities['Delhi'];

  // Auto fare calculation
  const autoCfg = cityConfig.autoFare;
  let autoFair = autoCfg.baseRate;
  if (km > autoCfg.baseKm) {
    autoFair += (km - autoCfg.baseKm) * autoCfg.perKmAfter;
  }
  if (isNight && autoCfg.nightSurchargePercent) {
    autoFair += autoFair * (autoCfg.nightSurchargePercent / 100);
  }

  // Taxi fare calculation
  const taxiCfg = cityConfig.taxiAcFare;
  let taxiFair = taxiCfg.baseRate;
  if (km > taxiCfg.baseKm) {
    taxiFair += (km - taxiCfg.baseKm) * taxiCfg.perKmAfter;
  }

  const roundedAutoMin = Math.round(autoFair * 0.9);
  const roundedAutoMax = Math.round(autoFair * 1.15);
  const roundedTaxiMin = Math.round(taxiFair * 0.95);
  const roundedTaxiMax = Math.round(taxiFair * 1.2);

  return {
    city: normalizedCity,
    km,
    auto: {
      min: roundedAutoMin,
      max: roundedAutoMax,
      standard: Math.round(autoFair),
      meterNote: autoCfg.tips,
    },
    taxi: {
      min: roundedTaxiMin,
      max: roundedTaxiMax,
      standard: Math.round(taxiFair),
    },
    scams: cityConfig.commonScams.map((s, idx) => ({
      id: `${normalizedCity}-scam-${idx}`,
      city: normalizedCity,
      category: 'transport' as const,
      title: s.scamName,
      description: s.description,
      severity: 'warning' as const,
      howToAvoid: s.howToAvoid,
      verified: true,
    })),
  };
}

export function getScamAlertsByCity(city?: string): ScamAlert[] {
  const alerts: ScamAlert[] = [];
  const entries = city
    ? Object.entries(rawCities).filter(([k]) => k.toLowerCase() === city.toLowerCase())
    : Object.entries(rawCities);

  const targetEntries = entries.length > 0 ? entries : Object.entries(rawCities);

  targetEntries.forEach(([cityName, config]) => {
    config.commonScams.forEach((scam, i) => {
      alerts.push({
        id: `${cityName}-scam-${i}`,
        city: cityName,
        category: (scam.scamName.toLowerCase().includes('taxi') || scam.scamName.toLowerCase().includes('tuk-tuk'))
          ? 'transport'
          : 'shopping',
        title: scam.scamName,
        description: scam.description,
        severity: 'warning',
        howToAvoid: scam.howToAvoid,
        verified: true,
      });
    });
  });

  return alerts;
}

export const BARGAIN_PHRASES: BargainPhrase[] = [
  {
    id: 'p1',
    hindiScript: 'भैया, मीटर से चलो ना?',
    hinglish: 'Bhaiya, meter se chalo na?',
    englishMeaning: 'Brother, please run by the government meter.',
    audioLanguage: 'hi-IN',
  },
  {
    id: 'p2',
    hindiScript: 'इतना तो सरकारी रेट नहीं है, ठीक लगाइए।',
    hinglish: 'Itna toh sarkari rate nahi hai, theek lagaiye.',
    englishMeaning: "This is not the government rate, please quote a fair price.",
    audioLanguage: 'hi-IN',
  },
  {
    id: 'p3',
    hindiScript: 'सिर्फ डायरेक्ट जाना है, कोई दुकान या कमीशन स्टॉप नहीं।',
    hinglish: 'Sirf direct jaana hai, koi dukaan ya commission stop nahi.',
    englishMeaning: 'Direct destination only. No shopping or commission stops.',
    audioLanguage: 'hi-IN',
  },
  {
    id: 'p4',
    hindiScript: 'भैया, ₹100 में चलना है तो चलिए।',
    hinglish: 'Bhaiya, ₹100 mein chalna hai toh chaliye.',
    englishMeaning: 'Brother, if you will take ₹100 then let us go.',
    audioLanguage: 'hi-IN',
  },
];
