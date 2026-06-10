import { CountyData } from "../types";

export const getCountyDemographics = async (county: string, state: string): Promise<CountyData> => {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Call our secure backend API instead of exposing the API key
      const response = await fetch('/api/get-county-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ county, state }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data as CountyData;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed for ${county}, ${state}:`, error);

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`All ${maxRetries} attempts failed for ${county}, ${state}. Last error:`, lastError);
  return {
    countyName: county,
    stateName: state,
    governor: "Unknown",
    senators: ["Unknown"],
    congressRepresentative: "Unknown",
    population: "Unknown",
    medianIncome: "Unknown",
    description: "Unable to load specific county data at this time. Please try again later.",
    topCities: []
  };
};

export const getCommunityAnnouncements = async (county: string, state: string): Promise<any[]> => {
  try {
    const response = await fetch('/api/county-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ county, state }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { items } = await response.json();
    return items || [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [
      { title: "Community update pending...", link: "#", pubDate: "" },
      { title: "Check back for local news.", link: "#", pubDate: "" }
    ];
  }
};

export const generateAdSketch = async (description: string): Promise<string | null> => {
  // Ad sketch generation is not currently implemented
  return null;
};
