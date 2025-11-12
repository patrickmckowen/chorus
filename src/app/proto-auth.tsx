// NOTE: Temporary prototype screen for payload capture — delete after fixtures are created.

import { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { appConfig } from '../lib/config';

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
};

export default function ProtoAuthScreen() {
  const [spotifyPayloads, setSpotifyPayloads] = useState<PayloadSection[]>([]);
  const [appleMusicPayloads, setAppleMusicPayloads] = useState<PayloadSection[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'chorus',
    path: 'oauthredirect',
  });

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
        { label: 'Spotify: Token Response', data: tokenData },
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
        payloads.push({ label: 'Spotify: /v1/me', data: meData });
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
          label: 'Spotify: /v1/me/player/currently-playing',
          data: currentlyPlayingData,
        });
      } else if (currentlyPlayingResponse.status === 204) {
        console.log('Spotify: No content currently playing');
        payloads.push({
          label: 'Spotify: /v1/me/player/currently-playing',
          data: { message: 'No content currently playing (204)' },
        });
      } else {
        console.warn(
          'Failed to fetch /currently-playing:',
          await currentlyPlayingResponse.text()
        );
      }

      setSpotifyPayloads(payloads);
      Alert.alert('Success', 'Spotify auth complete! Copy JSON from screen to docs/fixtures/spotify/');
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

      // Note: In a real implementation, you would use MusicKit JS or the native iOS SDK
      // For this prototype, we'll simulate the flow and show how to structure the API calls

      Alert.alert(
        'Apple Music Auth',
        'This prototype requires native MusicKit implementation. The code shows the proper API structure.\n\n' +
        'In production:\n' +
        '1. Use MusicKit.configure({ developerToken })\n' +
        '2. Call MusicKit.authorize() to get musicUserToken\n' +
        '3. Use both tokens to fetch user data\n\n' +
        'Simulating fetch with developer token only...'
      );

      // Step 1: Show the authorize structure (would normally return musicUserToken)
      const authStructure = {
        note: 'Call MusicKit.authorize() here',
        returns: 'musicUserToken',
      };

      const payloads: PayloadSection[] = [
        { label: 'Apple Music: Authorization Structure', data: authStructure },
      ];

      // Step 2: Example API call structure (requires valid musicUserToken in production)
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
      });

      // Attempt a catalog search (works with developer token only, no user token needed)
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Music Auth Prototype</Text>
        <Text style={styles.subtitle}>Capture authentication payloads for fixtures</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Authenticate Spotify"
          onPress={handleSpotifyAuth}
          disabled={loading}
        />
        <View style={styles.spacer} />
        <Button
          title="Authenticate Apple Music"
          onPress={handleAppleMusicAuth}
          disabled={loading}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>ERROR:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {spotifyPayloads.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spotify Payloads</Text>
          {spotifyPayloads.map((payload, index) => (
            <View key={index} style={styles.payloadSection}>
              <Text style={styles.payloadLabel}>{payload.label}</Text>
              <ScrollView style={styles.jsonContainer} horizontal>
                <Text style={styles.jsonText}>
                  {JSON.stringify(payload.data, null, 2)}
                </Text>
              </ScrollView>
            </View>
          ))}
        </View>
      )}

      {appleMusicPayloads.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apple Music Payloads</Text>
          {appleMusicPayloads.map((payload, index) => (
            <View key={index} style={styles.payloadSection}>
              <Text style={styles.payloadLabel}>{payload.label}</Text>
              <ScrollView style={styles.jsonContainer} horizontal>
                <Text style={styles.jsonText}>
                  {JSON.stringify(payload.data, null, 2)}
                </Text>
              </ScrollView>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Copy JSON payloads to docs/fixtures/ after testing
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 20,
  },
  spacer: {
    height: 12,
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
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
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  payloadSection: {
    marginBottom: 20,
  },
  payloadLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  jsonContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#000',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

