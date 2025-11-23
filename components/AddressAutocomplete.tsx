import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

interface PlacePrediction {
    description: string;
    place_id: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = "Start typing an address...",
    className = ""
}) => {
    const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string>('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const autocompleteService = useRef<any>(null);
    const debounceTimer = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Load Google Maps Script
    useEffect(() => {
        let mounted = true;

        const initGoogleMaps = async () => {
            try {
                await loadGoogleMapsScript();
                if (mounted) {
                    setScriptLoaded(true);
                    if (window.google && window.google.maps && window.google.maps.places) {
                        autocompleteService.current = new window.google.maps.places.AutocompleteService();
                    }
                }
            } catch (err) {
                console.error('Failed to load Google Maps:', err);
                if (mounted) {
                    setError('Failed to load address services');
                }
            }
        };

        initGoogleMaps();

        return () => {
            mounted = false;
        };
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = (input: string) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        if (!autocompleteService.current) {
            // Try to initialize again if script is loaded but service isn't
            if (window.google && window.google.maps && window.google.maps.places) {
                autocompleteService.current = new window.google.maps.places.AutocompleteService();
            } else {
                return; // Service not ready
            }
        }

        setIsLoading(true);
        setError('');

        try {
            const request = {
                input: input,
                types: ['address'],
                componentRestrictions: { country: 'us' } // Restrict to US for now
            };

            autocompleteService.current.getPlacePredictions(
                request,
                (predictions: any[], status: string) => {
                    setIsLoading(false);

                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        setSuggestions(predictions.map(p => ({
                            description: p.description,
                            place_id: p.place_id
                        })));
                        setShowSuggestions(true);
                    } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        setSuggestions([]);
                        setShowSuggestions(false);
                    } else {
                        // Don't show error for empty input or other non-critical statuses
                        setSuggestions([]);
                    }
                }
            );
        } catch (err) {
            console.error('Address autocomplete error:', err);
            setError('Unable to fetch suggestions');
            setSuggestions([]);
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Debounce API calls
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(newValue);
        }, 300);
    };

    const handleSelectSuggestion = (suggestion: PlacePrediction) => {
        onChange(suggestion.description);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
                disabled={!scriptLoaded}
            />

            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-[#006464] border-t-transparent rounded-full"></div>
                </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-[#006464] hover:text-white transition-colors border-b border-gray-200 last:border-b-0 text-base"
                        >
                            {suggestion.description}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <p className="text-red-600 text-sm mt-1 font-bold">{error}</p>
            )}
        </div>
    );
};
