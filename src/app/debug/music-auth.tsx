import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as AuthSession from 'expo-auth-session';

import type { JsonValue, MusicDebugPayload } from 'services/music/spotify';
import { runSpotifyDebugFlow } from 'services/music/spotify';
import { runAppleMusicDebugFlow } from 'services/music/appleMusic';

type CollapsedState = {
  [key: string]: boolean;
};

export default function MusicAuthDebugScreen() {
  const opacity = useSharedValue(0);
  const [spotifyPayloads, setSpotifyPayloads] = useState<MusicDebugPayload[]>([]);
  const [appleMusicPayloads, setAppleMusicPayloads] = useState<MusicDebugPayload[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<CollapsedState>({});

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'chorus',
    path: 'oauthredirect',
  });

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: opacity.value };
  }, []);

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const copyToClipboard = useCallback((data: JsonValue, label: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    Clipboard.setString(jsonString);
    Alert.alert('Copied', `${label} copied to clipboard`);
  }, []);

  const handleSpotifyDebug = useCallback(async () => {
    setLoading(true);
    setError('');
    setSpotifyPayloads([]);

    try {
      const { payloads } = await runSpotifyDebugFlow(redirectUri);
      setSpotifyPayloads(payloads);

      Alert.alert(
        '✓ Spotify Success',
        `Captured ${payloads.length} Spotify payload(s).\n\nTap each card to expand, then use the Copy JSON buttons to save to fixture files.`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      // Treat user-cancel as non-fatal and do not show as error
      if (errorMessage.toLowerCase().includes('cancel')) {
        return;
      }

      setError(`Spotify Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [redirectUri]);

  const handleAppleMusicDebug = useCallback(async () => {
    setLoading(true);
    setError('');
    setAppleMusicPayloads([]);

    try {
      const { payloads } = await runAppleMusicDebugFlow();
      setAppleMusicPayloads(payloads);

      Alert.alert(
        'Apple Music Info',
        'Full Apple Music integration requires native MusicKit.\n\nThis screen shows the correct API structure and sample responses gathered using your developer token.'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Apple Music Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderPayloadCard = useCallback(
    (payload: MusicDebugPayload, index: number, service: 'spotify' | 'apple') => {
      const key = `${service}-${index}`;
      const isCollapsed = collapsed[key] !== false; // Default to collapsed
      const isFailed = payload.label.includes('FAILED');

      return (
        <View key={key} style={[styles.payloadCard, isFailed && styles.payloadCardError]}>
          <View style={[styles.payloadHeader, isFailed && styles.payloadHeaderError]}>
            <View style={styles.payloadHeaderLeft}>
              <Text style={styles.payloadService}>
                {isFailed ? '⚠️' : service === 'spotify' ? '🎵' : '🍎'}
              </Text>
              <View style={styles.payloadTitleContainer}>
                <Text style={[styles.payloadLabel, isFailed && styles.payloadLabelError]}>
                  {payload.label}
                </Text>
                <Text style={styles.fixturePathText}>{payload.fixturePath}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => toggleCollapse(key)}
              style={styles.collapseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.collapseIcon}>{isCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
          </View>

          {!isCollapsed && (
            <View style={styles.payloadContent}>
              <ScrollView style={styles.jsonContainer} horizontal>
                <Text style={styles.jsonText}>{JSON.stringify(payload.data, null, 2)}</Text>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(payload.data, payload.label)}
          >
            <Text style={styles.copyButtonText}>📋 Copy JSON</Text>
          </TouchableOpacity>
        </View>
      );
    },
    [collapsed, copyToClipboard, toggleCollapse]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>Music Auth Debug</Text>
            <Text style={styles.subtitle}>
              Run Spotify and Apple Music auth flows and capture raw JSON payloads for fixtures.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleSpotifyDebug}
              style={[styles.spotifyButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Run Spotify Debug Flow</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleAppleMusicDebug}
              style={[styles.appleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Run Apple Music Debug Flow</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorLabel}>ERROR:</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {spotifyPayloads.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✓ Spotify Payloads</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap to expand, then copy to save fixtures.
                </Text>
              </View>
              {spotifyPayloads.map((payload, index) => renderPayloadCard(payload, index, 'spotify'))}
            </View>
          )}

          {appleMusicPayloads.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✓ Apple Music Payloads</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap to expand, then copy to save fixtures.
                </Text>
              </View>
              {appleMusicPayloads.map((payload, index) => renderPayloadCard(payload, index, 'apple'))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  spotifyButton: {
    flex: 1,
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  appleButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#b71c1c',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  payloadCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  payloadCardError: {
    backgroundColor: '#fff5f5',
    borderColor: '#ef5350',
  },
  payloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  payloadHeaderError: {
    backgroundColor: '#ffebee',
  },
  payloadHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payloadService: {
    fontSize: 24,
    marginRight: 12,
  },
  payloadTitleContainer: {
    flex: 1,
  },
  payloadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  payloadLabelError: {
    color: '#c62828',
  },
  fixturePathText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  collapseButton: {
    padding: 8,
  },
  collapseIcon: {
    fontSize: 14,
    color: '#666',
  },
  payloadContent: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  jsonContainer: {
    maxHeight: 200,
    padding: 12,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#000',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});


