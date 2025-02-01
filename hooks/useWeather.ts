// /hooks/useWeather.ts
import { useState, useEffect } from 'react';

interface WeatherData {
    hourly: {
        temperature_2m: number[];
        time: string[];
        weathercode: number[]; // Added weathercode property
    };
    // Add more fields as required
}

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

function useWeather(latitude?: number, longitude?: number) {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch if both latitude and longitude are provided
        if (latitude === undefined || longitude === undefined) {
            return;
        }

        const fetchWeather = async () => {
            try {
                setLoading(true);
                const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&timezone=auto`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.status})`);
                }
                const json = await response.json();
                setData(json);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [latitude, longitude]);

    return { data, loading, error };
}

export default useWeather;