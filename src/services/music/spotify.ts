import * as AuthSession from 'expo-auth-session';
import { appConfig } from 'lib/config';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type MusicDebugPayload = {
  label: string;
  data: JsonValue;
  fixturePath: string;
};

export type SpotifyDebugResult = {
  payloads: MusicDebugPayload[];
};

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SPOTIFY_SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-read-email',
  'user-read-private',
];

export async function runSpotifyDebugFlow(redirectUri: string): Promise<SpotifyDebugResult> {
  const clientId = appConfig.spotify.clientId;

  if (!clientId) {
    throw new Error('Spotify Client ID not configured in .env');
  }

  const payloads: MusicDebugPayload[] = [];

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
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Spotify auth flow was cancelled');
    }
    throw new Error(`Spotify auth failed: ${result.type}`);
  }

  const authCode = result.params.code;
  if (!authCode) {
    throw new Error('No Spotify authorization code returned');
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
    throw new Error(`Spotify token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();

  payloads.push({
    label: 'Spotify: Token Response',
    data: tokenData,
    fixturePath: 'docs/fixtures/spotify/auth.json',
  });

  const accessToken = (tokenData as { access_token?: string }).access_token;

  if (!accessToken) {
    throw new Error('Spotify token response did not include an access_token');
  }

  // Helper to call Spotify APIs and capture success or error payloads
  const callSpotifyEndpoint = async (
    label: string,
    path: string,
    fixturePath: string,
    options?: RequestInit
  ) => {
    const url = `${SPOTIFY_API_BASE}${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      ...(options ?? {}),
    });

    if (response.ok) {
      if (response.status === 204) {
        payloads.push({
          label,
          data: { message: 'No content (204)' },
          fixturePath,
        });
        return;
      }

      const data = await response.json();
      payloads.push({
        label,
        data,
        fixturePath,
      });
    } else {
      const errorText = await response.text();
      payloads.push({
        label: `${label} (FAILED)`,
        data: {
          error: `HTTP ${response.status}`,
          statusText: response.statusText,
          response: errorText,
          note: 'This API call failed - see error details above',
        },
        fixturePath,
      });
    }
  };

  // Step 4: Fetch /v1/me
  await callSpotifyEndpoint('Spotify: User Profile', '/me', 'docs/fixtures/spotify/me.json');

  // Step 5: Fetch /v1/me/player/currently-playing
  await callSpotifyEndpoint(
    'Spotify: Currently Playing',
    '/me/player/currently-playing',
    'docs/fixtures/spotify/currently-playing.json'
  );

  // Step 6: Fetch /v1/me/player/recently-played
  await callSpotifyEndpoint(
    'Spotify: Recently Played',
    '/me/player/recently-played',
    'docs/fixtures/spotify/recently-played.json'
  );

  return { payloads };
}


