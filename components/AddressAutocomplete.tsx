import React, { useState, useEffect, useRef } from 'react';

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
    const debounceTimer = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    const fetchSuggestions = async (input: string) => {
        if (!input || input.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Using Google Places Autocomplete API
            const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

            if (!apiKey) {
                throw new Error('Google Places API key not configured');
            }

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${apiKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch address suggestions');
            }

            const data = await response.json();

            if (data.status === 'OK') {
                setSuggestions(data.predictions || []);
                setShowSuggestions(true);
            } else if (data.status === 'ZERO_RESULTS') {
                setSuggestions([]);
                setShowSuggestions(false);
            } else {
                throw new Error(data.error_message || 'Failed to fetch suggestions');
            }
        } catch (err) {
            console.error('Address autocomplete error:', err);
            setError('Unable to fetch address suggestions');
            setSuggestions([]);
        } finally {
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
