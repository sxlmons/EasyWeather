import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Button } from 'react-native';
import MapView, { Marker, Callout, Region, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import useWeather from '../../hooks/useWeather';

/**
 * Helper to convert the API’s weathercode into a friendly description.
 */
function getWeatherDescription(code: number): string {
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown';
}

/**
 * Helper to choose a fillColor for a geofenced zone based on its temperature.
 * The returned color is semi-transparent so that map details remain visible.
 */
function getTemperatureColor(temp: number): string {
    if (temp < 10) return 'rgba(0, 0, 255, 0.3)';      // Blueish for cold
    else if (temp < 20) return 'rgba(0, 255, 0, 0.3)'; // Greenish for mild
    else if (temp < 30) return 'rgba(255, 165, 0, 0.3)'; // Orange for warm
    else return 'rgba(255, 0, 0, 0.3)';                  // Red for hot
}

export default function ForecastMap() {
    // Location and tracking state.
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [tracking, setTracking] = useState<boolean>(true);
    const [region, setRegion] = useState<Region | null>(null);

    // Request permissions and subscribe to realtime location updates.
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permission to access location was denied');
                return;
            }

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest,
                    timeInterval: 200,    // Frequency in milliseconds.
                    distanceInterval: 1,  // Frequency in meters.
                },
                (loc) => {
                    setLocation(loc);
                    if (tracking) {
                        setRegion({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        });
                    }
                }
            );
        })();

        return () => {
            if (subscription) subscription.remove();
        };
    }, [tracking]);

    // Initialize region once the location is available.
    useEffect(() => {
        if (location && !region) {
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    }, [location]);

    // Fetch weather data (using your existing useWeather hook).
    const { data, loading, error } = useWeather(
        location?.coords.latitude,
        location?.coords.longitude
    );

    if (locationError) {
        return (
            <View style={styles.centered}>
                <Text>{locationError}</Text>
            </View>
        );
    }

    if (!location || !region) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text>Fetching location...</Text>
            </View>
        );
    }

    // Extract current weather info for the overlay.
    const currentTemperature = data?.hourly?.temperature_2m[0];
    const currentWeatherCode =
        data?.hourly?.weathercode && data.hourly.weathercode[0] !== undefined
            ? data.hourly.weathercode[0]
            : undefined;
    const currentWeatherCondition =
        currentWeatherCode !== undefined ? getWeatherDescription(currentWeatherCode) : '';

    // Simulated geofenced zones. In a real app, you might fetch a grid of temperature data.
    const geofenceZones = [
        {
            id: 'zone1',
            // Slightly offset from the user's location.
            center: {
                latitude: location.coords.latitude + 0.01,
                longitude: location.coords.longitude + 0.01,
            },
            radius: 2000, // in meters
            temperature: 15, // degrees Celsius
        },
        {
            id: 'zone2',
            center: {
                latitude: location.coords.latitude - 0.01,
                longitude: location.coords.longitude - 0.01,
            },
            radius: 2000,
            temperature: 20,
        },
        {
            id: 'zone3',
            center: {
                latitude: location.coords.latitude + 0.02,
                longitude: location.coords.longitude - 0.01,
            },
            radius: 2000,
            temperature: 25,
        },
    ];

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={region}
                onRegionChangeComplete={(newRegion) => {
                    if (!tracking) setRegion(newRegion);
                }}
                showsUserLocation={true}
            >
                {/* Render simulated geofenced zones */}
                {geofenceZones.map((zone) => (
                    <Circle
                        key={zone.id}
                        center={zone.center}
                        radius={zone.radius}
                        fillColor={getTemperatureColor(zone.temperature)}
                        strokeColor="transparent"
                    />
                ))}

                {/* Existing Marker and Callout for the user's current weather */}
                <Marker
                    coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }}
                >
                    <Callout>
                        <View style={styles.callout}>
                            {error ? (
                                <Text>Error fetching weather data: {error}</Text>
                            ) : loading && !data ? (
                                <ActivityIndicator size="small" />
                            ) : data ? (
                                <>
                                    <Text style={styles.calloutTitle}>Current Weather</Text>
                                    <Text>Temperature: {data.hourly.temperature_2m[0]}°C</Text>
                                    {data.hourly.weathercode && (
                                        <Text>Condition: {getWeatherDescription(data.hourly.weathercode[0])}</Text>
                                    )}
                                </>
                            ) : (
                                <Text>No data available</Text>
                            )}
                        </View>
                    </Callout>
                </Marker>
            </MapView>

            {/* Overlay Box in the Top Left Showing Temperature and Weather Condition */}
            <View style={styles.overlayBox}>
                <Text style={styles.overlayText}>
                    {data && currentTemperature !== undefined ? `${currentTemperature}°C` : 'Loading...'}
                </Text>
                <Text style={styles.overlayText}>
                    {data && currentWeatherCondition ? currentWeatherCondition : ''}
                </Text>
            </View>

            {/* Toggle Button for Tracking vs. Free Mode */}
            <View style={styles.toggleContainer}>
                <Button
                    title={tracking ? 'Switch to Free Mode' : 'Focus on User'}
                    onPress={() => {
                        if (tracking) {
                            setTracking(false);
                        } else {
                            setTracking(true);
                            if (location) {
                                setRegion({
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                    latitudeDelta: region.latitudeDelta,
                                    longitudeDelta: region.longitudeDelta,
                                });
                            }
                        }
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    toggleContainer: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 8,
        padding: 4,
        zIndex: 100,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    callout: {
        width: 150,
        alignItems: 'center',
    },
    calloutTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
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
        fontSize: 14,
        marginBottom: 4,
        textAlign: 'center',
    },
});