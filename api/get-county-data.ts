import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini with server-side API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { county, state } = req.body;

    if (!county || !state) {
        return res.status(400).json({ error: 'County and state are required' });
    }

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Provide demographic and political information for ${county} County, ${state}, USA. 
        Return the data in JSON format. 
        IMPORTANT: For Governor, Senators, and Representative, include their party affiliation in parenthesis, e.g., "John Doe (D)" or "Jane Smith (R)".
        Include: Governor, Senators (names only with party), Representative (generic or specific if known with party), 
        approximate population, median household income, a 1 sentence description of the county's vibe,
        and the top 3 cities in the county. For each city, provide the name, population (as a string, e.g. "10,000"), and approximate latitude/longitude coordinates.`,
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
                const data = JSON.parse(response.text);
                return res.status(200).json(data);
            }
            throw new Error("No data returned from Gemini");
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed for ${county}, ${state}:`, error);

            // If this isn't the last attempt, wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    // All retries failed, return error
    console.error(`All ${maxRetries} attempts failed for ${county}, ${state}. Last error:`, lastError);
    return res.status(500).json({
        error: 'Failed to fetch county data',
        details: lastError?.message || 'Unknown error'
    });
}
