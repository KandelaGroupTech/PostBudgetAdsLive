import React, { useState, useEffect } from 'react';
import { LeftColumn } from './components/LeftColumn';
import { MiddleColumn } from './components/MiddleColumn';
import { RightColumn } from './components/RightColumn';
import { LocationSelector } from './components/LocationSelector';
import { GeoLocation } from './types';
import { Newspaper, CloudSun } from 'lucide-react';
import { getWeather } from './services/weatherService';

const App: React.FC = () => {
  // Default location
  const [location, setLocation] = useState<GeoLocation>({
    county: 'Marin',
    state: 'California'
  });

  const [weather, setWeather] = useState<string>("");

  useEffect(() => {
    const fetchWeather = async () => {
      setWeather("Checking forecast...");
      const w = await getWeather(location.county, location.state);
      setWeather(w);
    };
    fetchWeather();
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col text-[#1a1a1a]">

      {/* Header */}
      <header className="bg-[#FDFBF7] border-b-4 border-double border-black p-6 text-center relative z-10">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper size={32} className="text-[#006464]" />
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
                PostBudgetAds<span className="text-[#006464]">.com</span>
              </h1>
              <Newspaper size={32} className="text-[#006464]" />
            </div>
            <p className="text-xl tracking-[0.2em] uppercase text-gray-600 font-bold mb-2">
              The Community's Paper • Est. 2024
            </p>

            {/* Weather Display */}
            <div className="flex items-center gap-2 text-[#006464] font-bold text-xl handwritten-border px-4 py-1 border-dashed border-[#006464]">
              <CloudSun size={20} />
              <span>{weather}</span>
            </div>
          </div>

          {/* Date Stamp */}
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 rotate-[-2deg]">
            <div className="border-2 border-[#006464] px-4 py-1 text-[#006464] font-bold text-lg rounded-sm opacity-80">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - 3 Columns */}
      {/* Changed widths: Left 25%, Middle 50%, Right 25% */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)]">

        {/* Left: Demographics & Map (25%) */}
        <section className="w-full lg:w-1/4 h-full border-b-2 lg:border-b-0 border-black/10">
          <LeftColumn location={location} onLocationChange={setLocation} />
        </section>

        {/* Middle: Text Ads Feed (50%) */}
        <section className="w-full lg:w-1/2 h-full border-b-2 lg:border-b-0 border-black/10">
          <MiddleColumn location={location} />
        </section>

        {/* Right: Community & Sponsored (25%) */}
        <section className="w-full lg:w-1/4 h-full">
          <RightColumn location={location} />
        </section>

      </main>

      <LocationSelector currentLocation={location} onLocationChange={setLocation} />
    </div>
  );
};

export default App;