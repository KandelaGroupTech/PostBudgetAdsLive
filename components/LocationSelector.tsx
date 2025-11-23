import React, { useState, useEffect } from 'react';
import { Map, X, ChevronDown, Navigation } from 'lucide-react';
import { GeoLocation } from '../types';
import { US_STATES, getCountiesForState } from '../data/locations';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface LocationSelectorProps {
  currentLocation: GeoLocation;
  onLocationChange: (loc: GeoLocation) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ currentLocation, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

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
    setLocationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (county && state) {
      onLocationChange({ county, state });
      setIsOpen(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLoadingLocation(false);
      return;
    }

    try {
      // 1. Get Coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const { latitude, longitude } = position.coords;

      // 2. Load Google Maps API
      await loadGoogleMapsScript();

      // 3. Reverse Geocode
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

      if (!response.results || response.results.length === 0) {
        throw new Error('Could not determine location.');
      }

      // 4. Parse Results
      let foundState = '';
      let foundCounty = '';
      let country = '';

      // Look through address components
      for (const component of response.results[0].address_components) {
        if (component.types.includes('administrative_area_level_1')) {
          foundState = component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
          foundCounty = component.long_name.replace(' County', ''); // Remove " County" suffix
        }
        if (component.types.includes('country')) {
          country = component.short_name;
        }
      }

      // 5. Validate Country
      if (country !== 'US') {
        setLocationError('Sorry, this service is only available in the United States.');
        setIsLoadingLocation(false);
        return;
      }

      // 6. Validate State and County against our data
      if (!US_STATES.includes(foundState)) {
        setLocationError(`State not supported: ${foundState}`);
        setIsLoadingLocation(false);
        return;
      }

      const validCounties = getCountiesForState(foundState);

      // Try to match county (sometimes API returns "City and County of San Francisco" vs "San Francisco")
      let matchedCounty = '';
      if (validCounties.includes(foundCounty)) {
        matchedCounty = foundCounty;
      } else {
        // Fuzzy match or fallback
        const partialMatch = validCounties.find(c => foundCounty.includes(c) || c.includes(foundCounty));
        if (partialMatch) {
          matchedCounty = partialMatch;
        }
      }

      if (matchedCounty) {
        setState(foundState);
        setAvailableCounties(validCounties);
        setCounty(matchedCounty);
        // Auto-submit or just fill the form? User said "set the county", implies filling the form.
        // I'll fill the form so they can confirm.
      } else {
        setLocationError(`Could not match county: ${foundCounty}`);
      }

    } catch (error: any) {
      console.error('Location error:', error);
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationError('Please allow location access to use this feature.');
      } else {
        setLocationError('Failed to detect location. Please select manually.');
      }
    } finally {
      setIsLoadingLocation(false);
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

          {locationError && (
            <div className="text-red-600 text-sm font-bold text-center bg-red-50 p-2 border border-red-200">
              {locationError}
            </div>
          )}

          <div className="space-y-3 mt-8">
            <button
              type="submit"
              disabled={!state || !county}
              className={`w-full text-white py-3 font-bold text-xl transition-colors ${!state || !county ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-[#006464]'}`}
            >
              Go to County
            </button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative bg-[#FDFBF7] px-4 text-sm text-gray-500">OR</div>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full bg-white text-[#006464] border-2 border-[#006464] py-3 font-bold text-xl transition-colors hover:bg-[#006464] hover:text-white flex items-center justify-center gap-2"
            >
              {isLoadingLocation ? (
                <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
              ) : (
                <Navigation size={20} />
              )}
              Use Current Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};