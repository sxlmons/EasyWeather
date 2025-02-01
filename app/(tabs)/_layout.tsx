import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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
                name="home"
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
                name="account"
                options={{
                    title: 'Account',
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="person" size={size} color={color} />),
                }}
            />
            <Tabs.Screen
                name="sanjosegeofencing"
                options={{
                    title: 'Weather',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cloud" size={size} color={color} />),
                }}
            />
        </Tabs>
    );
}
