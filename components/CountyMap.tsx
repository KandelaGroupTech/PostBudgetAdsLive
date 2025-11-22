import React, { useEffect, useState } from 'react';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
import { STATE_FIPS } from '../data/fips';

interface CountyMapProps {
    stateName: string;
    countyName: string;
    topCities?: { name: string; lat: number; lng: number }[];
}

export const CountyMap: React.FC<CountyMapProps> = ({ stateName, countyName, topCities }) => {
    const [geoData, setGeoData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopology = async () => {
            try {
                const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
                const topology = await response.json();
                setGeoData(topology);
                setLoading(false);
            } catch (error) {
                console.error("Error loading map data:", error);
                setLoading(false);
            }
        };

        fetchTopology();
    }, []);

    // Re-thinking: It's cleaner to use d3-geo just for the path generation and React for rendering.

    if (loading || !geoData) {
        return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>;
    }

    const fips = STATE_FIPS[stateName];
    if (!fips) return <div>State not found</div>;

    // Filter geometry for the specific state
    const stateGeometry = (topojson.feature(geoData, geoData.objects.states) as any).features.find(
        (f: any) => String(f.id) === fips
    );

    const countiesGeometry = (topojson.feature(geoData, geoData.objects.counties) as any).features.filter(
        (f: any) => String(f.id).startsWith(fips)
    );

    if (!stateGeometry) return <div>Geometry not found</div>;

    // Create projection
    const projection = d3.geoAlbersUsa()
        .fitSize([400, 400], stateGeometry);

    const pathGenerator = d3.geoPath().projection(projection);

    return (
        <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* State Background */}
            <path
                d={pathGenerator(stateGeometry) || undefined}
                fill="#FDFBF7"
                stroke="#000"
                strokeWidth="2"
            />

            {/* Counties */}
            <g>
                {countiesGeometry.map((county: any) => {
                    const isSelected = county.properties.name === countyName;
                    return (
                        <path
                            key={county.id}
                            d={pathGenerator(county) || undefined}
                            fill={isSelected ? "#E5E7EB" : "transparent"}
                            stroke="#000"
                            strokeWidth="0.5"
                            className={`transition-colors duration-300 cursor-pointer hover:fill-[#006464] hover:opacity-50 ${isSelected ? 'fill-gray-200' : ''}`}
                        >
                            <title>{county.properties.name}</title>
                        </path>
                    );
                })}
            </g>

            {/* Cities */}
            {topCities?.map((city, i) => {
                const coords = projection([city.lng, city.lat]);
                if (!coords) return null;
                return (
                    <g key={i} transform={`translate(${coords[0]}, ${coords[1]})`}>
                        <circle r="4" fill="#006464" stroke="#fff" strokeWidth="1" />
                        <text
                            y="-6"
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-black uppercase tracking-wider"
                            style={{ textShadow: "0px 1px 2px rgba(255,255,255,0.8)" }}
                        >
                            {city.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};
