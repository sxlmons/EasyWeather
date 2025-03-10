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
    Keyboard,
} from 'react-native';
import useWeather from '../../hooks/useWeather';
import useLocation from '../../hooks/useLocation';
import useNominatim, { NominatimSearchResult } from '../../hooks/useNominatim';

/**
 * Define a type for our city data so that all listings include:
 * city, state, country, latitude, and longitude.
 */
interface CityData {
    id: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
}

export default function HomeScreen() {
    // Get the device's current location
    const { location, errorMsg: locationError } = useLocation();
    const { geocode, reverseGeocode } = useNominatim();
    const [userCity, setUserCity] = useState<CityData | null>(null);

    // State for manually added cities
    const [cities, setCities] = useState<CityData[]>([]);
    const [isAddingCity, setIsAddingCity] = useState(false);
    const [newCityName, setNewCityName] = useState('');
    const [suggestions, setSuggestions] = useState<NominatimSearchResult[]>([]);

    // Reverse geocode the user's location to get structured address details.
    useEffect(() => {
        async function fetchUserCity() {
            if (location) {
                try {
                    const result = await reverseGeocode(location.latitude, location.longitude);
                    const addr = result.address;
                    const cityName = addr.city || addr.town || addr.village || 'Unknown City';
                    const state = addr.state || 'Unknown State';
                    const country = addr.country || 'Unknown Country';
                    setUserCity({
                        id: 'user',
                        city: cityName,
                        state,
                        country,
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

    /**
     * When the user types in the input, call the geocode function after a debounce.
     * Only perform the search if the input length is greater than 2.
     */
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (newCityName.length > 2) {
                try {
                    const results = await geocode(newCityName);
                    // Filter results to ensure they include city/town/village, state, and country.
                    const filtered = results.filter(result => {
                        const addr = result.address;
                        return (addr.city || addr.town || addr.village) && addr.state && addr.country;
                    });
                    setSuggestions(filtered);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        };

        const delayDebounce = setTimeout(() => {
            fetchSuggestions();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [newCityName, geocode]);

    /**
     * When a suggestion is selected from the dropdown,
     * extract the required address components and add it to the cities list.
     */
    const handleSelectSuggestion = (suggestion: NominatimSearchResult) => {
        const addr = suggestion.address;
        const cityName = addr.city || addr.town || addr.village || 'Unknown City';
        const state = addr.state || 'Unknown State';
        const country = addr.country || 'Unknown Country';
        const newCity: CityData = {
            id: suggestion.place_id.toString(),
            city: cityName,
            state,
            country,
            latitude: parseFloat(suggestion.lat),
            longitude: parseFloat(suggestion.lon),
        };

        // Add the new city if it hasn’t been added already.
        if (!cities.find(c => c.id === newCity.id)) {
            setCities(prev => [...prev, newCity]);
        }
        setNewCityName('');
        setSuggestions([]);
        setIsAddingCity(false);
        Keyboard.dismiss();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Weather</Text>

            {/* User's Location Section */}
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
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter city name"
                                value={newCityName}
                                onChangeText={setNewCityName}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    setIsAddingCity(false);
                                    setNewCityName('');
                                    setSuggestions([]);
                                }}
                                style={styles.cancelButton}
                            >
                                <Text style={styles.cancelButtonText}>X</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsAddingCity(true)}
                            style={styles.addCityButton}
                        >
                            <Text style={styles.plusIcon}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {/* Dropdown suggestions */}
                {isAddingCity && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        {suggestions.map(suggestion => {
                            const addr = suggestion.address;
                            const displayCity = addr.city || addr.town || addr.village || 'Unknown City';
                            const displayState = addr.state || 'Unknown State';
                            const displayCountry = addr.country || 'Unknown Country';
                            return (
                                <TouchableOpacity
                                    key={suggestion.place_id}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSelectSuggestion(suggestion)}
                                >
                                    <Text>{`${displayCity}, ${displayState}, ${displayCountry}`}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                {cities.length === 0 && !isAddingCity ? (
                    <Text style={styles.noCityText}>No cities added yet.</Text>
                ) : (
                    cities.map(city => <CityWeatherItem key={city.id} city={city} />)
                )}
            </View>
        </ScrollView>
    );
}

/**
 * A component that displays weather information for a given city.
 * The city name is shown in the required format: {city}, {state}, {country}.
 */
function CityWeatherItem({ city }: { city: CityData }) {
    const { data, loading, error } = useWeather(city.latitude, city.longitude);
    const currentTemperature = data?.hourly?.temperature_2m?.[0];

    return (
        <View style={styles.cityItem}>
            <Text style={styles.cityName}>{`${city.city}, ${city.state}, ${city.country}`}</Text>
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 8,
    },
    cancelButton: {
        marginLeft: 8,
        backgroundColor: '#ff3b30',
        padding: 8,
        borderRadius: 5,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    suggestionsContainer: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        maxHeight: 200,
        marginBottom: 16,
    },
    suggestionItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    errorText: {
        color: 'red',
    },
    noCityText: {
        fontStyle: 'italic',
        color: '#555',
    },
});