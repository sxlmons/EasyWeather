import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Account() {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Account</Text>
            <Text style={styles.text}>User details, settings, and preferences can go here.</Text>
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
    heading: {
        fontSize: 24,
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
    },
});