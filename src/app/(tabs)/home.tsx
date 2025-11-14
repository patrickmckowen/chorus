import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chorus</Text>
        <Text style={styles.subtitle}>
          This will become your listening feed, powered by real TrackActivity data from Spotify and
          Apple Music.
        </Text>

        <View style={styles.body}>
          <Text style={styles.bodyText}>
            For now, you can experiment with music service authentication and raw payload capture on
            the dedicated debug screen.
          </Text>
        </View>

        <Link href="/debug/music-auth" asChild>
          <TouchableOpacity style={styles.debugButton}>
            <Text style={styles.debugButtonText}>Open Music Auth Debug</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
  },
  body: {
    marginTop: 24,
    marginBottom: 32,
  },
  bodyText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 21,
  },
  debugButton: {
    marginTop: 'auto',
    marginBottom: 24,
    backgroundColor: '#f2f2f7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  debugButtonText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#111827',
  },
});

