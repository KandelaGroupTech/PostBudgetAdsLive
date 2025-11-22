import React, { useState, useEffect } from 'react';
import { Map, X, ChevronDown } from 'lucide-react';
import { GeoLocation } from '../types';
import { US_STATES, getCountiesForState } from '../data/locations';

interface LocationSelectorProps {
  currentLocation: GeoLocation;
  onLocationChange: (loc: GeoLocation) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);

  // Initial setup if modal opens
  useEffect(() => {
    if (isOpen) {
        setState(currentLocation.state);
        // We don't immediately set county because we need to load the list first
        // But usually we want the user to make a conscious choice, so starting fresh is also fine.
        // Let's try to preserve it if the state matches.
        if (currentLocation.state) {
            const counties = getCountiesForState(currentLocation.state);
            setAvailableCounties(counties);
            if (counties.includes(currentLocation.county)) {
                setCounty(currentLocation.county);
            } else {
                setCounty('');
            }
        }
    }
  }, [isOpen, currentLocation]);

  // Update counties when state changes
  const handleStateChange = (newState: string) => {
    setState(newState);
    const counties = getCountiesForState(newState);
    setAvailableCounties(counties);
    setCounty(''); // Reset county when state changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (county && state) {
      onLocationChange({ county, state });
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-[#006464] text-white px-4 py-2 shadow-xl flex items-center gap-2 hover:bg-[#004d4d] transition-colors rounded-sm"
      >
        <Map size={18} />
        Change Location
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#FDFBF7] p-8 border-4 border-black shadow-2xl w-full max-w-md relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 hover:text-red-600"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-3xl font-bold mb-6 text-center">Select Region</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-lg font-bold mb-1">State</label>
            <div className="relative">
                <select
                required
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2 bg-white border-2 border-black appearance-none focus:outline-none focus:border-[#006464] font-['Patrick_Hand'] text-xl"
                >
                <option value="" disabled>Select a State</option>
                {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 pointer-events-none text-gray-500" size={20} />
            </div>
          </div>
          
          <div className="relative">
            <label className={`block text-lg font-bold mb-1 ${!state ? 'text-gray-400' : ''}`}>County</label>
            <div className="relative">
                <select
                required
                value={county}
                disabled={!state}
                onChange={(e) => setCounty(e.target.value)}
                className={`w-full p-2 bg-white border-2 border-black appearance-none focus:outline-none focus:border-[#006464] font-['Patrick_Hand'] text-xl ${!state ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' : ''}`}
                >
                <option value="" disabled>Select a County</option>
                {availableCounties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
                </select>
                <ChevronDown className={`absolute right-3 top-3 pointer-events-none ${!state ? 'text-gray-300' : 'text-gray-500'}`} size={20} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!state || !county}
            className={`w-full text-white py-3 font-bold text-xl transition-colors mt-4 ${!state || !county ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-[#006464]'}`}
          >
            Go to County
          </button>
        </form>
      </div>
    </div>
  );
};