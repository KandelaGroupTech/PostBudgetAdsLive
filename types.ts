export interface CountyData {
  countyName: string;
  stateName: string;
  governor: string;
  senators: string[];
  congressRepresentative: string;
  population: string;
  medianIncome: string;
  description: string;
  topCities: {
    name: string;
    population: string;
    lat: number;
    lng: number;
  }[];
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

export interface AdSubmission {
  locations: GeoLocation[];
  category: string;
  content: string;
  email: string; // Required
  phone?: string; // Optional
  address?: string; // Optional
  contact: string; // Deprecated, kept for backward compatibility
  totalAmount: number;
  tax: number;
  subtotal: number;
  attachment_url?: string;
  attachment_type?: 'image' | 'document';
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}
