// hooks/useNominatim.ts
import { useCallback } from 'react';

const BASE_URL = 'https://nominatim.openstreetmap.org';

export interface NominatimSearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        [key: string]: any;
    };
}

export interface NominatimReverseResult {
    place_id: number;
    display_name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        [key: string]: any;
    };
}

export default function useNominatim() {
    /**
     * Forward geocoding: Searches by query (e.g., city name)
     * and returns detailed address information.
     */
    const geocode = useCallback(async (query: string): Promise<NominatimSearchResult[]> => {
        const url = `${BASE_URL}/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                // Replace with your app name and valid contact info per Nominatim usage policy.
                'User-Agent': 'YourAppName/1.0 (youremail@example.com)',
            },
        });
        if (!response.ok) {
            throw new Error(`Geocoding error: ${response.status}`);
        }
        const data: NominatimSearchResult[] = await response.json();
        return data;
    }, []);

    /**
     * Reverse geocoding: Converts coordinates to an address.
     */
    const reverseGeocode = useCallback(
        async (latitude: number, longitude: number): Promise<NominatimReverseResult> => {
            const url = `${BASE_URL}/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'YourAppName/1.0 (youremail@example.com)',
                },
            });
            if (!response.ok) {
                throw new Error(`Reverse geocoding error: ${response.status}`);
            }
            const data: NominatimReverseResult = await response.json();
            return data;
        },
        []
    );

    return { geocode, reverseGeocode };
}