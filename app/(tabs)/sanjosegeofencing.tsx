import React, {useEffect, useRef, useState} from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import MapView, {Marker, Polygon, Region } from 'react-native-maps';

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

// --------------------
// Dynamic Zone Generation
// --------------------
const numberOfRows = 8;
const numberOfColumns = 6;

// Bottom-left corner of the grid (adjust these values as needed)
const latStart = 36.979;
const lonStart = -122.456;

// Size of each zone in degrees
const latStep = 0.10;
const lonStep = 0.14;

/**
 * Generates a grid of rectangular zones covering part of San José.
 */
function generateZones(): Zone[] {
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

            // Coordinates for the rectangular zone.
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
function getTemperatureColor(temp: number | null): string {
    if (temp === null) return 'rgba(128,128,128,0.3)'; // Gray if unknown
    if (temp < 5) return 'rgba(0, 0, 255, 0.3)';        // Blue for cold
    else if (temp < 12) return 'rgba(0, 255, 0, 0.3)';   // Green for mild
    else if (temp < 13) return 'rgba(255, 165, 0, 0.3)'; // Orange for warm
    else return 'rgba(255, 0, 0, 0.3)';                  // Red for hot
}

/**
 * Fetches the temperature at the given latitude and longitude using Open-Meteo.
 * Increments the API call counter each time it's called.
 */
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
export default function SanJoseDynamicGeofencing() {
    // Fixed region for San José.
    const sanJoseRegion: Region = {
        latitude: 37.3382,
        longitude: -121.8863,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
    };

    // Create the grid of zones dynamically.
    const [zones, setZones] = useState<Zone[]>(generateZones());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Use a ref for counting API calls.
    const apiCallCountRef = useRef<number>(0);

    // Helper to increment the API call counter.
    const incrementCallCount = () => {
        apiCallCountRef.current += 1;
    };

    // Effect to log and reset API call counter every minute.
    useEffect(() => {
        const logInterval = setInterval(() => {
            console.log(`API calls in the last minute: ${apiCallCountRef.current}`);
            apiCallCountRef.current = 0;
        }, 60000);
        return () => clearInterval(logInterval);
    }, []);

    // Function to fetch and update temperatures for all zones.
    async function fetchZoneTemperatures() {
        try {
            const updatedZones = await Promise.all(
                zones.map(async (zone) => {
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

    // Effect to fetch zone temperatures on mount and then poll every minute.
    useEffect(() => {
        fetchZoneTemperatures();
        const updateInterval = setInterval(fetchZoneTemperatures, 60000);
        return () => clearInterval(updateInterval);
    }, []);

    return (
        <View style={styles.container}>
            <MapView style={styles.map} region={sanJoseRegion}>
                {/* Render each zone as a polygon */}
                {zones.map((zone) => (
                    <Polygon
                        key={zone.id}
                        coordinates={zone.coordinates}
                        fillColor={getTemperatureColor(zone.temperature)}
                        strokeColor="transparent"
                    />
                ))}

                {/* Render a Marker at the centroid of each zone with the temperature label */}
                {zones.map((zone) => {
                    const centroid = computeCentroid(zone.coordinates);
                    return (
                        <Marker
                            key={zone.id + '-marker'}
                            coordinate={centroid}
                            anchor={{ x: 0.5, y: 0.5 }}
                            tracksViewChanges={false}
                        >
                            <View style={styles.zoneLabel}>
                                <Text style={styles.zoneLabelText}>
                                    {zone.temperature !== null ? `${zone.temperature}°C` : 'N/A'}
                                </Text>
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Optional overlay for overall status */}
            <View style={styles.overlayBox}>
                {loading ? (
                    <ActivityIndicator size="small" />
                ) : error ? (
                    <Text style={styles.overlayText}>Error: {error}</Text>
                ) : (
                    <Text style={styles.overlayText}>Zone temperatures updated.</Text>
                )}
            </View>
        </View>
    );
}

// --------------------
// Styles
// --------------------
const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    overlayBox: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 8,
        elevation: 10,
        zIndex: 200,
    },
    overlayText: {
        fontSize: 12,
        textAlign: 'center',
    },
    zoneLabel: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 2,
        paddingVertical: 1,
        borderRadius: 2,
    },
    zoneLabelText: {
        fontSize: 6,
        fontWeight: 'semibold',
        color: '#000',
    },
});