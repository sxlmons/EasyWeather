// hooks/useNominatim.ts
import { useCallback } from 'react';

const BASE_URL = 'https://nominatim.openstreetmap.org';

export interface NominatimSearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    // Additional properties can be added as needed.
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
     * Forward geocoding: Given a query (e.g., a city name), return matching results.
     */
    const geocode = useCallback(async (query: string): Promise<NominatimSearchResult[]> => {
        const url = `${BASE_URL}/search?format=json&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                // Replace with your app name and contact information per Nominatim's usage policy.
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
     * Reverse geocoding: Given latitude and longitude, return an address.
     */
    const reverseGeocode = useCallback(
        async (latitude: number, longitude: number): Promise<NominatimReverseResult> => {
            const url = `${BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}`;
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