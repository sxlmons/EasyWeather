// HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Keyboard
} from 'react-native';
import useWeather from '../../hooks/useWeather';
import useLocation from '../../hooks/useLocation';
import useNominatim from '../../hooks/useNominatim';

export default function HomeScreen() {
    // Get the device's current location
    const { location, errorMsg: locationError } = useLocation();
    const { geocode, reverseGeocode } = useNominatim();
    const [userCity, setUserCity] = useState<{ name: string; latitude: number; longitude: number } | null>(null);

    // Manage manually added cities (each with an id, name, and coordinates)
    const [cities, setCities] = useState<Array<{ id: string; name: string; latitude: number; longitude: number }>>([]);
    const [isAddingCity, setIsAddingCity] = useState(false);
    const [newCityName, setNewCityName] = useState('');

    // Reverse geocode the user's location using Nominatim
    useEffect(() => {
        async function fetchUserCity() {
            if (location) {
                try {
                    const result = await reverseGeocode(location.latitude, location.longitude);
                    const { address } = result;
                    // Use city, town, village, state, or country (whichever is available)
                    const cityName = address.city || address.town || address.village || address.state || address.country || 'Unknown Location';
                    setUserCity({
                        name: cityName,
                        latitude: location.latitude,
                        longitude: location.longitude,
                    });
                } catch (error) {
                    console.error('Error in reverse geocoding:', error);
                }
            }
        }
        fetchUserCity();
    }, [location, reverseGeocode]);

    // Add a city using forward geocoding via Nominatim
    const addCity = async () => {
        if (!newCityName) return;
        try {
            const results = await geocode(newCityName);
            if (results && results.length > 0) {
                const firstResult = results[0];
                const cityToAdd = {
                    id: Date.now().toString(), // A simple unique ID
                    name: newCityName,
                    latitude: parseFloat(firstResult.lat),
                    longitude: parseFloat(firstResult.lon),
                };
                setCities(prev => [...prev, cityToAdd]);
                setNewCityName('');
                setIsAddingCity(false);
                Keyboard.dismiss();
            } else {
                alert('City not found. Please try another name.');
            }
        } catch (error) {
            console.error('Error geocoding city:', error);
            alert('Error adding city. Please try again.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Weather</Text>

            {/* User’s Location Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Location</Text>
                {locationError ? (
                    <Text style={styles.errorText}>{locationError}</Text>
                ) : userCity ? (
                    <CityWeatherItem city={userCity} />
                ) : (
                    <ActivityIndicator size="large" />
                )}
            </View>

            {/* Other Cities Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Other Cities</Text>
                <View style={styles.addCityContainer}>
                    {isAddingCity ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter city name"
                                value={newCityName}
                                onChangeText={setNewCityName}
                                onSubmitEditing={addCity}
                            />
                            <TouchableOpacity onPress={addCity} style={styles.addButton}>
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsAddingCity(true)}
                            style={styles.addCityButton}
                        >
                            <Text style={styles.plusIcon}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {cities.length === 0 ? (
                    <Text style={styles.noCityText}>No cities added yet.</Text>
                ) : (
                    cities.map(city => <CityWeatherItem key={city.id} city={city} />)
                )}
            </View>
        </ScrollView>
    );
}

/**
 * A component that displays the weather for a given city.
 */
function CityWeatherItem({ city }: { city: { name: string; latitude: number; longitude: number } }) {
    const { data, loading, error } = useWeather(city.latitude, city.longitude);
    const currentTemperature = data?.hourly?.temperature_2m?.[0];

    return (
        <View style={styles.cityItem}>
            <Text style={styles.cityName}>{city.name}</Text>
            {loading ? (
                <ActivityIndicator size="small" />
            ) : error ? (
                <Text style={styles.errorText}>Error: {error}</Text>
            ) : (
                <Text style={styles.temperatureText}>
                    {currentTemperature ? `${currentTemperature}°C` : 'N/A'}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    cityName: {
        fontSize: 18,
    },
    temperatureText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addCityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    addCityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusIcon: {
        fontSize: 28,
        color: '#fff',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 8,
        marginRight: 8,
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
    },
    noCityText: {
        fontStyle: 'italic',
        color: '#555',
    },
});