import React, { useState, useMemo } from 'react';
import { GeoLocation } from '../types';
import { getAllStates, getCountiesForState, isEntireStateSelected, addAllCountiesInState, removeAllCountiesInState, addLocation, removeLocation } from '../utils/locationHelpers';
import { X } from 'lucide-react';

interface LocationMultiSelectProps {
    selectedLocations: GeoLocation[];
    onChange: (locations: GeoLocation[]) => void;
}

export const LocationMultiSelect: React.FC<LocationMultiSelectProps> = ({
    selectedLocations,
    onChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedState, setExpandedState] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const states = getAllStates();

    // Filter states based on search
    const filteredStates = useMemo(() => {
        if (!searchTerm) return states;
        return states.filter(state =>
            state.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, states]);

    const handleStateToggle = (state: string) => {
        if (isEntireStateSelected(state, selectedLocations)) {
            onChange(removeAllCountiesInState(state, selectedLocations));
        } else {
            onChange(addAllCountiesInState(state, selectedLocations));
        }
    };

    const handleCountyToggle = (county: string, state: string) => {
        const location = { county, state };
        const isSelected = selectedLocations.some(
            loc => loc.county === county && loc.state === state
        );

        if (isSelected) {
            onChange(removeLocation(location, selectedLocations));
        } else {
            onChange(addLocation(location, selectedLocations));
        }
    };

    const handleRemoveLocation = (location: GeoLocation) => {
        onChange(removeLocation(location, selectedLocations));
    };

    const toggleStateExpansion = (state: string) => {
        setExpandedState(expandedState === state ? null : state);
    };

    return (
        <div className="space-y-4">
            {/* Selected Locations Display */}
            {selectedLocations.length > 0 && (
                <div className="border-2 border-black p-4 bg-white">
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-2">
                        Selected Locations ({selectedLocations.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedLocations.map((loc, idx) => (
                            <div
                                key={`${loc.state}-${loc.county}-${idx}`}
                                className="inline-flex items-center gap-2 bg-[#006464] text-white px-3 py-1 text-sm font-medium"
                            >
                                <span>{loc.county}, {loc.state}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLocation(loc)}
                                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                    aria-label={`Remove ${loc.county}, ${loc.state}`}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dropdown Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full border-2 border-black px-4 py-3 text-left font-medium hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                    <span>Add Locations</span>
                    <span className="text-xl">{isDropdownOpen ? '−' : '+'}</span>
                </button>

                {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-96 overflow-y-auto">
                        {/* Search */}
                        <div className="p-3 border-b-2 border-black sticky top-0 bg-white">
                            <input
                                type="text"
                                placeholder="Search states..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006464]"
                            />
                        </div>

                        {/* States List */}
                        <div className="divide-y-2 divide-gray-200">
                            {filteredStates.map(state => {
                                const counties = getCountiesForState(state);
                                const isStateSelected = isEntireStateSelected(state, selectedLocations);
                                const isExpanded = expandedState === state;

                                return (
                                    <div key={state} className="hover:bg-gray-50">
                                        <div className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isStateSelected}
                                                    onChange={() => handleStateToggle(state)}
                                                    className="w-5 h-5 accent-[#006464] cursor-pointer"
                                                />
                                                <label className="font-bold text-base cursor-pointer flex-1" onClick={() => handleStateToggle(state)}>
                                                    {state} ({counties.length} counties)
                                                </label>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleStateExpansion(state)}
                                                className="px-3 py-1 text-sm font-bold hover:bg-black hover:text-white transition-colors border border-black"
                                            >
                                                {isExpanded ? 'Hide' : 'Show'} Counties
                                            </button>
                                        </div>

                                        {/* Counties List */}
                                        {isExpanded && (
                                            <div className="bg-gray-50 border-t-2 border-gray-200 p-3 grid grid-cols-2 gap-2">
                                                {counties.map(county => {
                                                    const isSelected = selectedLocations.some(
                                                        loc => loc.county === county && loc.state === state
                                                    );
                                                    return (
                                                        <label
                                                            key={county}
                                                            className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleCountyToggle(county, state)}
                                                                className="w-4 h-4 accent-[#006464]"
                                                            />
                                                            <span className="text-sm">{county}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
