// Location helper utilities for county and state selection

import { US_STATES, COUNTIES_BY_STATE } from '../data/locations';
import { GeoLocation } from '../types';

/**
 * Get all available states
 */
export function getAllStates(): string[] {
    return US_STATES;
}

/**
 * Get all counties for a specific state
 */
export function getCountiesForState(state: string): string[] {
    return COUNTIES_BY_STATE[state] || [];
}

/**
 * Get total number of counties in a state
 */
export function getCountyCountForState(state: string): number {
    return getCountiesForState(state).length;
}

/**
 * Check if a location is already selected
 */
export function isLocationSelected(
    location: GeoLocation,
    selectedLocations: GeoLocation[]
): boolean {
    return selectedLocations.some(
        loc => loc.county === location.county && loc.state === location.state
    );
}

/**
 * Add a location to the selected list (if not already present)
 */
export function addLocation(
    location: GeoLocation,
    selectedLocations: GeoLocation[]
): GeoLocation[] {
    if (isLocationSelected(location, selectedLocations)) {
        return selectedLocations;
    }
    return [...selectedLocations, location];
}

/**
 * Remove a location from the selected list
 */
export function removeLocation(
    location: GeoLocation,
    selectedLocations: GeoLocation[]
): GeoLocation[] {
    return selectedLocations.filter(
        loc => !(loc.county === location.county && loc.state === location.state)
    );
}

/**
 * Add all counties from a state to the selected list
 */
export function addAllCountiesInState(
    state: string,
    selectedLocations: GeoLocation[]
): GeoLocation[] {
    const counties = getCountiesForState(state);
    const newLocations = [...selectedLocations];

    counties.forEach(county => {
        const location = { county, state };
        if (!isLocationSelected(location, newLocations)) {
            newLocations.push(location);
        }
    });

    return newLocations;
}

/**
 * Remove all counties from a state from the selected list
 */
export function removeAllCountiesInState(
    state: string,
    selectedLocations: GeoLocation[]
): GeoLocation[] {
    return selectedLocations.filter(loc => loc.state !== state);
}

/**
 * Check if all counties in a state are selected
 */
export function isEntireStateSelected(
    state: string,
    selectedLocations: GeoLocation[]
): boolean {
    const stateCounties = getCountiesForState(state);
    const selectedCountiesInState = selectedLocations.filter(
        loc => loc.state === state
    );

    return stateCounties.length > 0 &&
        selectedCountiesInState.length === stateCounties.length;
}
