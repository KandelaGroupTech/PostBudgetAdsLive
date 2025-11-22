import React, { useEffect, useState } from 'react';
import { MapPin, User, Users, DollarSign, Briefcase, Building } from 'lucide-react';
import { CountyData, GeoLocation } from '../types';
import { getCountyDemographics } from '../services/geminiService';
import { CountyMap } from './CountyMap';

interface LeftColumnProps {
  location: GeoLocation;
  onLocationChange: (location: GeoLocation) => void;
}

export const LeftColumn: React.FC<LeftColumnProps> = ({ location, onLocationChange }) => {
  const [data, setData] = useState<CountyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const demoData = await getCountyDemographics(location.county, location.state);

      setData(demoData);
      setLoading(false);
    };

    fetchData();
  }, [location]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-[#006464] rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-gray-500">Sketching details for {location.county}...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto border-r-2 border-black/10 bg-[#FDFBF7]">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold mb-2 teal-ink">{location.county} County</h2>
        <p className="text-xl text-gray-600 uppercase tracking-widest border-b border-black pb-2 inline-block">
          {location.state}
        </p>
      </div>

      {/* Map Visual */}
      <div className="w-full aspect-square mb-8 border-2 border-black p-2 bg-white rotate-1 shadow-lg">
        <CountyMap
          stateName={location.state}
          countyName={location.county}
          topCities={data?.topCities}
          onCountyClick={(countyName) => onLocationChange({ county: countyName, state: location.state })}
        />
      </div>

      {/* Demographics */}
      {data && (
        <div className="space-y-6 text-lg">
          <div className="border-l-4 border-[#006464] pl-4 italic mb-6">
            "{data.description}"
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InfoItem label="Governor" value={data.governor} icon={<User size={20} />} />
            <InfoItem label="Senators" value={data.senators.join(" & ")} icon={<Users size={20} />} />
            <InfoItem label="Representative" value={data.congressRepresentative} icon={<Briefcase size={20} />} />
            <div className="h-px bg-black/20 my-4"></div>
            <InfoItem label="Population" value={data.population} icon={<Users size={20} />} />
            <InfoItem label="Median Household Income" value={data.medianIncome} icon={<DollarSign size={20} />} />

            {data.topCities && data.topCities.length > 0 && (
              <>
                <div className="h-px bg-black/20 my-4"></div>
                <div className="flex items-start group">
                  <div className="mr-3 mt-1 text-[#006464] opacity-70 group-hover:opacity-100 transition-opacity">
                    <Building size={20} />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500 uppercase tracking-wider font-bold">Top Cities</span>
                    <ul className="list-none">
                      {data.topCities.map((city, index) => (
                        <li key={index} className="text-lg font-medium">{city.name} <span className="text-sm text-gray-500">({city.population})</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 text-center text-sm text-gray-400">
        <p>Data estimated for illustrative purposes.</p>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="flex items-start group">
    <div className="mr-3 mt-1 text-[#006464] opacity-70 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
    <div>
      <span className="block text-sm text-gray-500 uppercase tracking-wider font-bold">{label}</span>
      <span className="text-xl font-medium">{value}</span>
    </div>
  </div>
);
