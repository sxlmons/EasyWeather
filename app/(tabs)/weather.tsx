import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import useLocation from '../../hooks/useLocation';

// --------------------
// Interfaces
// --------------------
interface Coordinate {
    latitude: number;
    longitude: number;
}

interface Zone {
    id: string;
    coordinates: Coordinate[];
    temperature: number | null;
}

interface GradientStop {
    temp: number;
    color: [number, number, number];
}

// --------------------
// Grid & Zone Parameters
// --------------------
const numberOfRows = 8;
const numberOfColumns = 6;

// Size of each zone in degrees
const latStep = 0.08;
const lonStep = 0.10;

/**
 * Generates a grid of rectangular zones.
 *
 * Instead of a fixed bottom-left corner, we pass in the
 * starting latitude and longitude. In our example we’ll
 * calculate these so that the grid is centered on the user's location.
 */
function generateZones(latStart: number, lonStart: number): Zone[] {
    const zones: Zone[] = [];
    let zoneCount = 0;
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfColumns; col++) {
            zoneCount++;

            // Calculate the corners of the zone.
            const latMin = latStart + row * latStep;
            const latMax = latStart + (row + 1) * latStep;
            const lonMin = lonStart + col * lonStep;
            const lonMax = lonStart + (col + 1) * lonStep;

            const coordinates: Coordinate[] = [
                { latitude: latMin, longitude: lonMin },
                { latitude: latMin, longitude: lonMax },
                { latitude: latMax, longitude: lonMax },
                { latitude: latMax, longitude: lonMin },
            ];

            zones.push({
                id: `zone${zoneCount}`,
                coordinates,
                temperature: null,
            });
        }
    }
    return zones;
}

// --------------------
// Helper Functions
// --------------------
/**
 * Computes the centroid (average position) of an array of coordinates.
 */
function computeCentroid(coordinates: Coordinate[]): Coordinate {
    const total = coordinates.reduce(
        (acc, cur) => ({
            latitude: acc.latitude + cur.latitude,
            longitude: acc.longitude + cur.longitude,
        }),
        { latitude: 0, longitude: 0 }
    );
    return {
        latitude: total.latitude / coordinates.length,
        longitude: total.longitude / coordinates.length,
    };
}

/**
 * Returns a semi-transparent fill color based on a temperature value.
 */
// Define the gradient stops once
const gradient: GradientStop[] = [
    { temp: -10, color: [0, 0, 139] },     // Very dark blue
    { temp: -7.5, color: [0, 0, 205] },    // Dark blue
    { temp: -5, color: [0, 0, 255] },      // Blue
    { temp: -2.5, color: [173, 216, 230] },// Light blue
    { temp: 0, color: [240, 248, 255] },   // Blue whitish blue
    { temp: 2.5, color: [255, 255, 224] },  // Very light yellow
    { temp: 5, color: [255, 255, 153] },    // Light yellow
    { temp: 7.5, color: [255, 255, 0] },     // Yellow
    { temp: 10, color: [255, 255, 0] },     // Yellow (plateau)
    { temp: 12.5, color: [204, 204, 0] },   // Dark yellow
    { temp: 15, color: [255, 165, 100] },   // Light orange
    { temp: 17.5, color: [255, 140, 0] },   // Orange
    { temp: 20, color: [255, 120, 0] },     // Dark orange
    { temp: 25, color: [255, 80, 80] },     // Light red
    { temp: 28, color: [255, 0, 0] },       // Red
    { temp: 32, color: [139, 0, 0] },       // Dark red
    { temp: 35, color: [100, 0, 0] },       // Very dark red
];
// Helper to convert a color tuple to a rgba string
function rgbaFromColor(color: [number, number, number], alpha: number = 0.5): string {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function getTemperatureColor(temp: number | null): string {
    // Return a default gray if temperature is unknown
    if (temp === null) return 'rgba(128, 128, 128, 0.3)';

    // If temperature is below the lowest stop, return the lowest color.
    if (temp <= gradient[0].temp) {
        return rgbaFromColor(gradient[0].color);
    }

    // If temperature is above the highest stop, return the highest color.
    if (temp >= gradient[gradient.length - 1].temp) {
        return rgbaFromColor(gradient[gradient.length - 1].color);
    }

    // Interpolate between the two gradient stops that enclose the temperature.
    for (let i = 0; i < gradient.length - 1; i++) {
        const start = gradient[i];
        const end = gradient[i + 1];

        if (temp >= start.temp && temp <= end.temp) {
            const factor = (temp - start.temp) / (end.temp - start.temp);
            const r = Math.round(start.color[0] + factor * (end.color[0] - start.color[0]));
            const g = Math.round(start.color[1] + factor * (end.color[1] - start.color[1]));
            const b = Math.round(start.color[2] + factor * (end.color[2] - start.color[2]));
            return rgbaFromColor([r, g, b]);
        }
    }

    // Fallback (this line should not be reached)
    return 'rgba(128, 128, 128, 0.3)';
}



async function fetchTemperatureForZone(
    lat: number,
    lon: number,
    incrementCallCount: () => void
): Promise<number> {
    incrementCallCount(); // Count this API call.
    const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch temperature');
    }
    const json = await response.json();
    // Assume the current temperature is the first value.
    return json.hourly.temperature_2m[0];
}

// --------------------
// Component
// --------------------
export default function DynamicGeofencing() {
    // Get the user's location from your custom hook.
    const { location, errorMsg } = useLocation();

    // State for zones, loading, and any temperature-fetch errors.
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ref for counting API calls.
    const apiCallCountRef = useRef<number>(0);
    const incrementCallCount = () => {
        apiCallCountRef.current += 1;
    };

    // Log and reset API call counter every minute.
    useEffect(() => {
        const logInterval = setInterval(() => {
            console.log(`API calls in the last minute: ${apiCallCountRef.current}`);
            apiCallCountRef.current = 0;
        }, 60000);
        return () => clearInterval(logInterval);
    }, []);

    /**
     * Fetches and updates temperatures for the given zones.
     */
    async function fetchZoneTemperatures(zonesToUpdate: Zone[]) {
        try {
            const updatedZones = await Promise.all(
                zonesToUpdate.map(async (zone) => {
                    const centroid = computeCentroid(zone.coordinates);
                    const temp = await fetchTemperatureForZone(
                        centroid.latitude,
                        centroid.longitude,
                        incrementCallCount
                    );
                    return { ...zone, temperature: temp };
                })
            );
            setZones(updatedZones);
        } catch (err: any) {
            setError(err.message || 'Error fetching temperatures');
        } finally {
            setLoading(false);
        }
    }

    /**
     * When the user's location becomes available, generate the grid so that
     * it is centered on the location. Then fetch the initial temperatures.
     */
    useEffect(() => {
        if (location) {
            // Calculate the bottom-left corner so that the grid is centered.
            const latStart = location.latitude - (numberOfRows * latStep) / 2;
            const lonStart = location.longitude - (numberOfColumns * lonStep) / 2;
            const initialZones = generateZones(latStart, lonStart);
            setZones(initialZones);
            fetchZoneTemperatures(initialZones);
        }
    }, [location]);

    /**
     * Poll for updated zone temperatures every minute.
     */
    useEffect(() => {
        if (location && zones.length > 0) {
            const interval = setInterval(() => {
                // Use the current zones to update temperatures.
                fetchZoneTemperatures(zones);
            }, 1200000);
            return () => clearInterval(interval);
        }
    }, [location, zones]);

    // If the location is not yet available, show a loading indicator.
    if (!location) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text>Fetching your location...</Text>
            </View>
        );
    }

    // Show any location error message.
    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text>Error: {errorMsg}</Text>
            </View>
        );
    }

    // Optionally, display temperature-fetch errors.
    if (error) {
        return (
            <View style={styles.container}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    // Define the map region centered on the user's location.
    const mapRegion: Region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
    };

    return (
        <MapView style={styles.map} region={mapRegion}>
            {zones.map((zone) => (
                <Polygon
                    key={zone.id}
                    coordinates={zone.coordinates}
                    fillColor={getTemperatureColor(zone.temperature)}
                    strokeColor="rgba(0,0,0,0.5)"
                />
            ))}

            {zones.map((zone) => {
                const centroid = computeCentroid(zone.coordinates);
                return (
                    <Marker key={`marker-${zone.id}`} coordinate={centroid}>
                        {/* Custom view to display temperature instead of a red pin */}
                        <View style={styles.tempContainer}>
                            <Text style={styles.tempText}>
                                {zone.temperature !== null ? `${zone.temperature}°C` : 'Loading...'}
                            </Text>
                        </View>
                    </Marker>
                );
            })}
        </MapView>
    );
}

// --------------------
// Styles
// --------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    map: {
        flex: 1,
    },
    tempContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 5,
        borderColor: '#000',
        borderWidth: 1,
    },
    tempText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
});