import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as AuthSession from 'expo-auth-session';
import { appConfig } from '../../lib/config';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-read-email',
  'user-read-private',
];

type PayloadSection = {
  label: string;
  data: any;
  fixturePath: string;
};

type CollapsedState = {
  [key: string]: boolean;
};

export default function HomeScreen() {
  const opacity = useSharedValue(0);
  const [spotifyPayloads, setSpotifyPayloads] = useState<PayloadSection[]>([]);
  const [appleMusicPayloads, setAppleMusicPayloads] = useState<PayloadSection[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<CollapsedState>({});

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'chorus',
    path: 'oauthredirect',
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: opacity.value };
  }, []);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (data: any, label: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    Clipboard.setString(jsonString);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  // ========== SPOTIFY FLOW ==========
  const handleSpotifyAuth = async () => {
    setLoading(true);
    setError('');
    setSpotifyPayloads([]);

    try {
      const clientId = appConfig.spotify.clientId;
      if (!clientId) {
        throw new Error('Spotify Client ID not configured in .env');
      }

      console.log('Spotify Redirect URI:', redirectUri);

      // Step 1: Create auth request with PKCE
      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        scopes: SPOTIFY_SCOPES,
        usePKCE: true,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      // Step 2: Start authorization flow
      const result = await request.promptAsync({
        authorizationEndpoint: SPOTIFY_AUTH_ENDPOINT,
      });

      if (result.type !== 'success') {
        // User cancelled or dismissed the auth flow
        if (result.type === 'cancel' || result.type === 'dismiss') {
          setLoading(false);
          return; // Exit silently, don't show error
        }
        throw new Error(`Auth failed: ${result.type}`);
      }

      const authCode = result.params.code;
      if (!authCode) {
        throw new Error('No authorization code returned');
      }

      // Step 3: Exchange code for access token
      const tokenResponse = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: redirectUri,
          code_verifier: request.codeVerifier || '',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Spotify Token Data:', tokenData);

      const payloads: PayloadSection[] = [
        {
          label: 'Spotify: Token Response',
          data: tokenData,
          fixturePath: 'docs/fixtures/spotify/auth.json',
        },
      ];

      // Step 4: Fetch /v1/me
      const meResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('Spotify /me:', meData);
        payloads.push({
          label: 'Spotify: User Profile',
          data: meData,
          fixturePath: 'docs/fixtures/spotify/me.json',
        });
      } else {
        console.warn('Failed to fetch /v1/me:', await meResponse.text());
      }

      // Step 5: Fetch /v1/me/player/currently-playing
      const currentlyPlayingResponse = await fetch(
        `${SPOTIFY_API_BASE}/me/player/currently-playing`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (currentlyPlayingResponse.status === 200) {
        const currentlyPlayingData = await currentlyPlayingResponse.json();
        console.log('Spotify /currently-playing:', currentlyPlayingData);
        payloads.push({
          label: 'Spotify: Currently Playing',
          data: currentlyPlayingData,
          fixturePath: 'docs/fixtures/spotify/currently-playing.json',
        });
      } else if (currentlyPlayingResponse.status === 204) {
        console.log('Spotify: No content currently playing');
        payloads.push({
          label: 'Spotify: Currently Playing',
          data: { message: 'No content currently playing (204)' },
          fixturePath: 'docs/fixtures/spotify/currently-playing.json',
        });
      } else {
        console.warn(
          'Failed to fetch /currently-playing:',
          await currentlyPlayingResponse.text()
        );
      }

      setSpotifyPayloads(payloads);
      Alert.alert(
        '✓ Success',
        `Captured ${payloads.length} Spotify payload(s)!\n\nTap each card to expand, then use the Copy JSON buttons to save to fixture files.`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Spotify auth error:', errorMessage);
      setError(`Spotify Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== APPLE MUSIC FLOW ==========
  const handleAppleMusicAuth = async () => {
    setLoading(true);
    setError('');
    setAppleMusicPayloads([]);

    try {
      const developerToken = appConfig.appleMusic.developerToken;
      if (!developerToken) {
        throw new Error('Apple Music Developer Token not configured in .env');
      }

      Alert.alert(
        'Apple Music Auth',
        'This prototype requires native MusicKit implementation. The code shows the proper API structure.\n\n' +
          'In production:\n' +
          '1. Use MusicKit.configure({ developerToken })\n' +
          '2. Call MusicKit.authorize() to get musicUserToken\n' +
          '3. Use both tokens to fetch user data\n\n' +
          'Simulating fetch with developer token only...'
      );

      // Step 1: Show the authorize structure
      const authStructure = {
        note: 'Call MusicKit.authorize() here',
        returns: 'musicUserToken',
      };

      const payloads: PayloadSection[] = [
        {
          label: 'Apple Music: Authorization Structure',
          data: authStructure,
          fixturePath: 'docs/fixtures/appleMusic/authorize.json',
        },
      ];

      // Step 2: Example API call structure
      const apiCallExample = {
        endpoint: `${APPLE_MUSIC_API_BASE}/me/recent/played/tracks`,
        headers: {
          Authorization: `Bearer ${developerToken.substring(0, 20)}...`,
          'Music-User-Token': '<musicUserToken from MusicKit.authorize()>',
        },
        note: 'This endpoint requires a valid Music-User-Token from MusicKit authorization',
      };

      payloads.push({
        label: 'Apple Music: API Call Structure',
        data: apiCallExample,
        fixturePath: 'docs/fixtures/appleMusic/recent-played.json',
      });

      // Attempt a catalog search (works with developer token only)
      try {
        const catalogResponse = await fetch(
          `${APPLE_MUSIC_API_BASE}/catalog/us/search?term=Beatles&types=songs&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${developerToken}`,
            },
          }
        );

        if (catalogResponse.ok) {
          const catalogData = await catalogResponse.json();
          console.log('Apple Music Catalog Search:', catalogData);
          payloads.push({
            label: 'Apple Music: Catalog Search (Developer Token Only)',
            data: catalogData,
            fixturePath: 'docs/fixtures/appleMusic/catalog-search.json',
          });
        }
      } catch (catalogErr) {
        console.warn('Catalog search failed:', catalogErr);
      }

      setAppleMusicPayloads(payloads);
      Alert.alert(
        'Note',
        'For full Apple Music integration, implement native MusicKit in iOS. This shows API structure for reference.'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Apple Music auth error:', errorMessage);
      setError(`Apple Music Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPayloadCard = (payload: PayloadSection, index: number, service: string) => {
    const key = `${service}-${index}`;
    const isCollapsed = collapsed[key] !== false; // Default to collapsed

    return (
      <View key={key} style={styles.payloadCard}>
        <View style={styles.payloadHeader}>
          <View style={styles.payloadHeaderLeft}>
            <Text style={styles.payloadService}>{service === 'spotify' ? '🎵' : '🍎'}</Text>
            <View style={styles.payloadTitleContainer}>
              <Text style={styles.payloadLabel}>{payload.label}</Text>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>Chorus</Text>
            <Text style={styles.subtitle}>Music Service Testing</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleSpotifyAuth}
              style={[styles.spotifyButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Connect Spotify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAppleMusicAuth}
              style={[styles.appleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Connect Apple Music</Text>
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
                  Tap to expand, then copy to save fixtures
                </Text>
              </View>
              {spotifyPayloads.map((payload, index) =>
                renderPayloadCard(payload, index, 'spotify')
              )}
            </View>
          )}

          {appleMusicPayloads.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✓ Apple Music Payloads</Text>
                <Text style={styles.sectionSubtitle}>
                  Tap to expand, then copy to save fixtures
                </Text>
              </View>
              {appleMusicPayloads.map((payload, index) =>
                renderPayloadCard(payload, index, 'apple')
              )}
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
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  payloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
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
