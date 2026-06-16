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
            // === STEP 1: Use Google Search Grounding to get verified, current political figures ===
            // NOTE: responseSchema cannot be used together with googleSearch grounding,
            // so we do this as a separate freeform call first, then inject the results into step 2.
            let politicsData = { governor: "", senators: [] as string[], representative: "" };
            try {
                const politicsResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    tools: [{ googleSearch: {} }],
                    contents: `Search the web and return ONLY a raw JSON object (no markdown, no explanation) with the current political officials for ${state}, USA as of 2026.
Use this exact format:
{"governor": "Full Name (D or R)", "senators": ["Full Name (D or R)", "Full Name (D or R)"], "representative": "Full Name (D or R)"}

- governor: the current elected Governor of ${state} as of January 2026 (the winner of the most recent gubernatorial election, not an acting or interim governor)
- senators: the two current US Senators for ${state}
- representative: the US House Representative for the district that covers ${county} County, ${state}`,
                });

                if (politicsResponse.text) {
                    const raw = politicsResponse.text.replace(/```json|```/g, "").trim();
                    politicsData = JSON.parse(raw);
                }
            } catch (politicsError) {
                console.warn(`Step 1 politics lookup failed for ${state}, proceeding without verified data:`, politicsError);
            }

            // === STEP 2: Get full structured county data, with verified politics injected into the prompt ===
            const politicsContext = politicsData.governor
                ? `IMPORTANT - Use EXACTLY these verified political figures (do not substitute or change them):
  - Governor of ${state}: ${politicsData.governor}
  - US Senators for ${state}: ${politicsData.senators.join(" and ")}
  - US House Representative for ${county} County: ${politicsData.representative}`
                : `It is currently 2026. Use the most current political figures.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Provide demographic and political information for ${county} County, ${state}, USA.
        Return the data in JSON format.
        IMPORTANT: For Governor, Senators, and Representative, include their party affiliation in parenthesis, e.g., "John Doe (D)" or "Jane Smith (R)".
        Include: Governor, Senators (names only with party), Representative (generic or specific if known with party),
        approximate population, median household income, a 1 sentence description of the county's vibe,
        and the top 3 cities in the county. For each city, provide the name, population (as a string, e.g. "10,000"), and approximate latitude/longitude coordinates.
        ${politicsContext}`,
                config: {
                    systemInstruction: "You are an expert in US local politics and geography. It is currently the year 2026. When political figures are explicitly provided to you, use them exactly as given.",
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
