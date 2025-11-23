      Return the data in JSON format.
  IMPORTANT: For Governor, Senators, and Representative, include their party affiliation in parenthesis, e.g., "John Doe (D)" or "Jane Smith (R)".
    Include: Governor, Senators(names only with party), Representative(generic or specific if known with party),
      approximate population, median household income, a 1 sentence description of the county's vibe,
      and the top 3 cities in the county.For each city, provide the name, population(as a string, e.g. "10,000"), and approximate latitude / longitude coordinates.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            countyName: { type: Type.STRING },
            stateName: { type: Type.STRING },
            governor: { type: Type.STRING },
            senators: { type: Type.ARRAY, items: { type: Type.STRING } },
            congressRepresentative: { type: Type.STRING },
            population: { type: Type.STRING },
            medianIncome: { type: Type.STRING },
            description: { type: Type.STRING },
            topCities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  population: { type: Type.STRING },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["name", "population", "lat", "lng"]
              }
            },
          },
          required: ["countyName", "stateName", "governor", "senators", "population", "medianIncome", "description", "topCities"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CountyData;
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error fetching demographics:", error);
    // Fallback data in case of error
    return {
      countyName: county,
      stateName: state,
      governor: "Unknown",
      senators: ["Unknown"],
      congressRepresentative: "Unknown",
      population: "Unknown",
      medianIncome: "Unknown",
      description: "Unable to load specific county data at this time.",
      topCities: []
    };
  }
};

export const getWeather = async (county: string, state: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Give me a very short(3 - 5 words) description of the typical weather for ${ county } County, ${ state } for today's date. 
      Example: "Sunny, 72°F, Light Breeze".Do not include any intro text.`,
    });
    return response.text?.trim() || "Partly Cloudy";
  } catch (error) {
    console.error("Error fetching weather:", error);
    return "Clear Skies";
  }
}

export const getCommunityAnnouncements = async (county: string, state: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 realistic, brief community announcements for ${ county } County, ${ state }.
Examples: High school sports results, charity drives, new park openings, town hall meetings, road closures.
  Constraint: Each announcement must be very short(max 15 words).
      Return only a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return ["Community update pending...", "Check back for local news.", "School board meets tonight.", "Main St. Farmers Market open.", "Volunteer fire dept fundraiser."];
  } catch (error) {
    console.error("Error fetching announcements", error);
    return ["Local news unavailable at the moment.", "Please check back later."];
  }
};

export const generateAdSketch = async (description: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: `A charcoal or pencil sketch of: ${ description }. 
      The style should be vintage japanese stationery, hand drawn, black and white, on cream paper background.
  Simple, elegant, no text in the image.`,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${ part.inlineData.mimeType }; base64, ${ part.inlineData.data } `;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating ad sketch:", error);
    return null;
  }
};