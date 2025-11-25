import React, { useState, useEffect } from 'react';
import { LeftColumn } from '../components/LeftColumn';
import { MiddleColumn } from '../components/MiddleColumn';
import { RightColumn } from '../components/RightColumn';
import { LocationSelector } from '../components/LocationSelector';
import { PostAdModal } from '../components/PostAdModal';
import { GeoLocation } from '../types';
import { Newspaper, CloudSun, PenSquare } from 'lucide-react';
import { getWeather } from '../services/weatherService';

export const Home: React.FC = () => {
    // Load location from localStorage or use default
    const getInitialLocation = (): GeoLocation => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedLocation');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    // Fall through to default
                }
            }
        }
        return {
            county: 'Sussex',
            state: 'Massachusetts'
        };
    };

    const [location, setLocation] = useState<GeoLocation>(getInitialLocation());
    const [weather, setWeather] = useState<string>("");
    const [showPostAdModal, setShowPostAdModal] = useState(false);

    // Save location to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedLocation', JSON.stringify(location));
        }
    }, [location]);

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

            {/* Floating Post Ad Button */}
            <button
                onClick={() => setShowPostAdModal(true)}
                className="fixed bottom-24 right-6 bg-[#006464] hover:bg-[#004d4d] text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-40 flex items-center gap-2"
                aria-label="Post an Ad"
                import React, {useState, useEffect} from 'react';
            import {LeftColumn} from '../components/LeftColumn';
            import {MiddleColumn} from '../components/MiddleColumn';
            import {RightColumn} from '../components/RightColumn';
            import {LocationSelector} from '../components/LocationSelector';
            import {PostAdModal} from '../components/PostAdModal';
            import {GeoLocation} from '../types';
            import {Newspaper, CloudSun, PenSquare} from 'lucide-react';
            import {getWeather} from '../services/weatherService';

export const Home: React.FC = () => {
    // Load location from localStorage or use default
    const getInitialLocation = (): GeoLocation => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('selectedLocation');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                // Fall through to default
            }
            }
        }
            return {
                county: 'Sussex',
            state: 'Massachusetts'
        };
    };

            const [location, setLocation] = useState<GeoLocation>(getInitialLocation());
                const [weather, setWeather] = useState<string>("");
                    const [showPostAdModal, setShowPostAdModal] = useState(false);

    // Save location to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
                        localStorage.setItem('selectedLocation', JSON.stringify(location));
        }
    }, [location]);

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

                        {/* Floating Post Ad Button */}
                        <button
                            onClick={() => setShowPostAdModal(true)}
                            className="fixed bottom-24 right-6 bg-[#006464] hover:bg-[#004d4d] text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-40 flex items-center gap-2"
                            aria-label="Post an Ad"
                        >
                            <PenSquare size={24} />
                            <span className="hidden sm:inline font-bold">Post an Ad</span>
                        </button>

                        <LocationSelector currentLocation={location} onLocationChange={setLocation} />
                        <PostAdModal
                            isOpen={showPostAdModal}
                            onClose={() => setShowPostAdModal(false)}
                            currentLocation={location}
                        />
                    </div>
                    );
};
