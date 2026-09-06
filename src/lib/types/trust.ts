export interface VehicleFare {
  baseFare: number;
  perKmRate: number;
  nightSurchargePercent: number;
  meterMandatory: boolean;
}

export interface FairPriceGuide {
  city: string;
  auto: VehicleFare;
  prepaidTaxi: VehicleFare;
  guidePerDay: { min: number; max: number };
  monumentEntryAvg: number;
  negotiationTips: string[];
}

export interface ScamAlert {
  id: string;
  city: string;
  category: 'transport' | 'guides' | 'shopping' | 'temples' | 'general';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  howToAvoid: string;
  verified: boolean;
}

export interface CulturalRule {
  state: string;
  site: string;
  attire: {
    men: string;
    women: string;
    footwear: string;
  };
  photography: string;
  customs: string;
  taboos: string;
}

export interface BargainPhrase {
  id: string;
  hindiScript: string;
  hinglish: string;
  englishMeaning: string;
  audioLanguage: string;
}
