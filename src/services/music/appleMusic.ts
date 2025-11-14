import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

import { appConfig } from 'lib/config';
import type { JsonValue, MusicDebugPayload } from './spotify';

export type AppleMusicAuthResult = {
  musicUserToken: string;
  authorizationStatus?: 'authorized' | 'denied' | 'notDetermined' | 'restricted';
};

export type AppleMusicDebugResult = {
  payloads: MusicDebugPayload[];
};

type AppleMusicAuthModuleType = {
  getMusicUserToken(developerToken: string): Promise<AppleMusicAuthResult>;
};

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

function getAppleDeveloperTokenOrThrow(): string {
  const developerToken = appConfig.appleMusic.developerToken;

  if (!developerToken) {
    throw new Error('Apple Music Developer Token not configured in .env');
  }

  return developerToken;
}

const AppleMusicAuth: AppleMusicAuthModuleType = requireNativeModule<AppleMusicAuthModuleType>(
  'AppleMusicAuth'
);

export async function getAppleMusicUserToken(): Promise<AppleMusicAuthResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Music auth is only supported on iOS');
  }

  const developerToken = getAppleDeveloperTokenOrThrow();
  return AppleMusicAuth.getMusicUserToken(developerToken);
}

export async function runAppleMusicDebugFlow(): Promise<AppleMusicDebugResult> {
  const developerToken = getAppleDeveloperTokenOrThrow();
  const payloads: MusicDebugPayload[] = [];

  // Step 1: Authorization structure (no real tokens, just flow description)
  const authStructure: JsonValue = {
    note: 'Uses native MusicKit via Expo Module',
    steps: [
      'MusicAuthorization.request()',
      'If authorized, AppleMusicAuth.getMusicUserToken(developerToken)',
      'Use returned musicUserToken with developerToken for Apple Music API requests',
    ],
    returns: 'AppleMusicAuthResult { musicUserToken, authorizationStatus }',
  };

  payloads.push({
    label: 'Apple Music: Authorization Structure',
    data: authStructure,
    fixturePath: 'docs/fixtures/appleMusic/authorize.json',
  });

  // Step 2: Call native module to get Music User Token and push metadata-only payload
  let musicUserToken: string | null = null;
  let authorizationStatus: AppleMusicAuthResult['authorizationStatus'];

  try {
    const authResult = await getAppleMusicUserToken();
    musicUserToken = authResult.musicUserToken;
    authorizationStatus = authResult.authorizationStatus;

    const tokenPreview =
      typeof musicUserToken === 'string' && musicUserToken.length > 10
        ? `${musicUserToken.slice(0, 6)}...${musicUserToken.slice(-4)}`
        : '***redacted***';

    const tokenMetadata: JsonValue = {
      musicUserTokenPreview: tokenPreview,
      length: musicUserToken.length,
      authorizationStatus: authorizationStatus ?? 'authorized',
    };

    payloads.push({
      label: 'Apple Music: Music User Token (metadata only)',
      data: tokenMetadata,
      fixturePath: 'docs/fixtures/appleMusic/authorize.json',
    });
  } catch (error) {
    const err = error as any;
    const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : undefined;
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : JSON.stringify(err);

    if (code === 'APPLE_MUSIC_AUTH_DENIED') {
      // Surface to caller so it can be treated like a user-cancel.
      throw err;
    }

    // For other known errors, capture a structured payload and return gracefully.
    const errorPayload: JsonValue = {
      code: code ?? 'UNKNOWN',
      message,
    };

    payloads.push({
      label: 'Apple Music: Authorization or Token Fetch (FAILED)',
      data: errorPayload,
      fixturePath: 'docs/fixtures/errors/appleMusic-authorize.json',
    });

    return { payloads };
  }

  // Step 3: Call /me/recent/played/tracks using both tokens
  if (musicUserToken) {
    try {
      const recentPlayedResponse = await fetch(
        `${APPLE_MUSIC_API_BASE}/me/recent/played/tracks`,
        {
          headers: {
            Authorization: `Bearer ${developerToken}`,
            'Music-User-Token': musicUserToken,
          },
        }
      );

      if (recentPlayedResponse.ok) {
        const recentPlayedData = (await recentPlayedResponse.json()) as JsonValue;
        payloads.push({
          label: 'Apple Music: Recent Played Tracks',
          data: recentPlayedData,
          fixturePath: 'docs/fixtures/appleMusic/recent-played.json',
        });
      } else {
        const errorText = await recentPlayedResponse.text();
        payloads.push({
          label: 'Apple Music: Recent Played Tracks (FAILED)',
          data: {
            error: `HTTP ${recentPlayedResponse.status}`,
            statusText: recentPlayedResponse.statusText,
            response: errorText,
            note: 'This API call failed - see error details above',
          },
          fixturePath: 'docs/fixtures/errors/appleMusic-recent-played.json',
        });
      }
    } catch (error) {
      payloads.push({
        label: 'Apple Music: Recent Played Tracks (FAILED)',
        data: {
          error: 'Network or unexpected error',
          detail: error instanceof Error ? error.message : JSON.stringify(error),
        },
        fixturePath: 'docs/fixtures/errors/appleMusic-recent-played.json',
      });
    }
  }

  // Step 4: Optional catalog search using only the developer token
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
      const catalogData = (await catalogResponse.json()) as JsonValue;
      payloads.push({
        label: 'Apple Music: Catalog Search (Developer Token Only)',
        data: catalogData,
        fixturePath: 'docs/fixtures/appleMusic/catalog-search.json',
      });
    } else {
      const errorText = await catalogResponse.text();
      payloads.push({
        label: 'Apple Music: Catalog Search (FAILED)',
        data: {
          error: `HTTP ${catalogResponse.status}`,
          statusText: catalogResponse.statusText,
          response: errorText,
          note: 'This API call failed - see error details above',
        },
        fixturePath: 'docs/fixtures/errors/appleMusic-catalog-search.json',
      });
    }
  } catch (error) {
    payloads.push({
      label: 'Apple Music: Catalog Search (FAILED)',
      data: {
        error: 'Network or unexpected error',
        detail: error instanceof Error ? error.message : JSON.stringify(error),
      },
      fixturePath: 'docs/fixtures/errors/appleMusic-catalog-search.json',
    });
  }

  return { payloads };
}


