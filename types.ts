export interface CountyData {
  countyName: string;
  stateName: string;
  governor: string;
  senators: string[];
  congressRepresentative: string;
  population: string;
  medianIncome: string;
  description: string;
  topCities: string[];
}

export interface TextAd {
  id: string;
  category: string;
  content: string;
  contact: string;
  timestamp: string;
}

export interface SponsoredAd {
  id: string;
  title: string;
  description: string;
  imageUrl?: string; // Base64 data URI
}

export interface GeoLocation {
  county: string;
  state: string;
}
