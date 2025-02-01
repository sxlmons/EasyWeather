import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import useWeather from '../../hooks/useWeather';

export default function Home() {
    // Example coordinates; you can replace these with dynamic values or user input.
    const latitude = 40.7128;
    const longitude = -74.0060;
    const { data, loading, error } = useWeather(latitude, longitude);



    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    // For example, display the first temperature value from the hourly forecast.
    const currentTemperature = data?.hourly?.temperature_2m[0];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Current Temperature</Text>
            <Text style={styles.temperature}>
                {currentTemperature ? `${currentTemperature}°C` : 'N/A'}
            </Text>
            {/* You can add more weather details or styling here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 12,
    },
    temperature: {
        fontSize: 48,
        fontWeight: 'bold',
    },
});