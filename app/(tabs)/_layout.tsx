import { Tabs } from 'expo-router';
import React from 'react';

import {Ionicons} from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                // Customize your tab bar styling here
                // Example: headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    // Uncomment and adjust to use icons:
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="home" size={size} color={color} />),
                }}
            />
            <Tabs.Screen
                name="forecast"
                options={{
                    title: 'Forecast Map',
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="map" size={size} color={color} />),
                }}
            />
            <Tabs.Screen
                name="weather"
                options={{
                    title: 'Weather',
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="cloud" size={size} color={color} />),
                }}
            />
            <Tabs.Screen
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />),
                }}
            />
        </Tabs>
    );
}
