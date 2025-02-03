// useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
    latitude: number;
    longitude: number;
}

interface UseLocationResult {
    location: LocationData | null;
    errorMsg: string | null;
}

export default function useLocation(): UseLocationResult {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            // Request permission to access location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            // Get the current position
            let loc = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
        })();
    }, []);

    return { location, errorMsg };
}