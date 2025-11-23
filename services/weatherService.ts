// Weather service using OpenWeatherMap API (Free)

interface WeatherData {
    temperature: number;
    weatherText: string;
    unit: string;
}

/**
 * Get current weather from OpenWeatherMap
 * Free tier: 1,000 calls/day, no credit card required
 */
export const getWeather = async (county: string, state: string): Promise<string> => {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

        if (!apiKey) {
            console.warn('OpenWeatherMap API key not configured, using fallback');
            return 'Weather Unavailable';
        }

        // Use geocoding to get coordinates for the county
        // Try multiple query formats for better success rate
        const queries = [
            `${county}, ${state}, USA`,  // Try without "County" first
            `${county} County, ${state}, USA`,
            `${county}, ${state}`
        ];

        // Add hardcoded fallbacks for counties that don't geocode well
        const cityFallbacks: Record<string, string> = {
            'Marin': 'San Rafael',
            'San Francisco': 'San Francisco',
        };

        if (cityFallbacks[county]) {
            queries.push(`${cityFallbacks[county]}, ${state}, USA`);
        }

        let geoData = null;
        for (const locationQuery of queries) {
            const geoResponse = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`
            );

            if (geoResponse.ok) {
                const data = await geoResponse.json();
                if (data && data.length > 0) {
                    geoData = data;
                    break;
                }
            }
        }

        if (!geoData || geoData.length === 0) {
            console.warn(`Could not find location for ${county}, ${state}`);
            return 'Location Not Found';
        }

        const { lat, lon } = geoData[0];

        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
        );

        if (!weatherResponse.ok) {
            throw new Error(`Weather fetch failed: ${weatherResponse.statusText}`);
        }

        const weatherData = await weatherResponse.json();

        if (weatherData && weatherData.main && weatherData.weather) {
            const temp = Math.round(weatherData.main.temp);
            const description = weatherData.weather[0].main; // e.g., "Clouds", "Clear", "Rain"

            return `${description}, ${temp}°F`;
        }

        return 'Weather Unavailable';
    } catch (error) {
        console.error('Error fetching weather:', error);
        return 'Clear Skies'; // Fallback
    }
};

/**
 * Get weather forecast (optional, for future use)
 */
export const getWeatherForecast = async (county: string, state: string): Promise<string[]> => {
    try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

        if (!apiKey) {
            return [];
        }

        // Use geocoding to get coordinates
        const locationQuery = `${county} County, ${state}, USA`;
        const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationQuery)}&limit=1&appid=${apiKey}`
        );

        if (!geoResponse.ok) {
            return [];
        }

        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            return [];
        }

        const { lat, lon } = geoData[0];

        // Fetch 5-day forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
        );

        if (!forecastResponse.ok) {
            return [];
        }

        const forecastData = await forecastResponse.json();

        if (forecastData && forecastData.list) {
            // Get one forecast per day (every 8th item = 24 hours)
            return forecastData.list
                .filter((_: any, index: number) => index % 8 === 0)
                .slice(0, 5)
                .map((item: any) => {
                    const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
                    const temp = Math.round(item.main.temp);
                    const description = item.weather[0].main;
                    return `${date}: ${description}, ${temp}°F`;
                });
        }

        return [];
    } catch (error) {
        console.error('Error fetching forecast:', error);
        return [];
    }
};
