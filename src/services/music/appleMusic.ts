import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

import { appConfig } from 'lib/config';
import type { JsonValue, MusicDebugPayload } from './spotify';

export type AppleMusicAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'restricted'
  | 'notDetermined'
  | 'unknown';

export type AppleMusicDebugResult = {
  payloads: MusicDebugPayload[];
};

type AppleMusicAuthModuleType = {
  requestAuthorization(): Promise<AppleMusicAuthorizationStatus>;
  getUserToken(developerToken: string): Promise<string>;
};

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';
const AppleMusicAuth = requireNativeModule<AppleMusicAuthModuleType>('AppleMusicAuth');

type NativeAppleMusicError = Error & { code?: string };

function ensureIOS(feature: string) {
  if (Platform.OS !== 'ios') {
    throw new Error(`${feature} is only supported on iOS devices.`);
  }
}

function isNativeAppleMusicError(error: unknown): error is NativeAppleMusicError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in (error as Record<string, unknown>) &&
      typeof (error as Record<string, unknown>).code === 'string'
  );
}

function mapAppleMusicError(error: unknown): Error {
  if (isNativeAppleMusicError(error)) {
    const code = error.code as string;

    if (code === 'MusicKitNotAvailableException') {
      const friendlyError = new Error(
        'MusicKit is not available on this device. Use a real iOS device running iOS 15 or later.'
      );
      (friendlyError as NativeAppleMusicError).code = code;
      return friendlyError;
    }

    if (code === 'DeveloperTokenEmptyException') {
      const friendlyError = new Error(
        'Apple Music developer token missing. Set EXPO_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN in your env file.'
      );
      (friendlyError as NativeAppleMusicError).code = code;
      return friendlyError;
    }

    return error;
  }

  return error instanceof Error ? error : new Error(String(error));
}

function getAppleDeveloperTokenOrThrow(): string {
  const developerToken = appConfig.appleMusic.developerToken;

  if (!developerToken) {
    throw new Error('Apple Music Developer Token not configured in .env');
  }

  return developerToken;
}

export async function requestAppleMusicAuthorization(): Promise<AppleMusicAuthorizationStatus> {
  ensureIOS('Apple Music authorization');

  try {
    const status = await AppleMusicAuth.requestAuthorization();
    return status;
  } catch (error) {
    throw mapAppleMusicError(error);
  }
}

export async function getAppleMusicUserToken(): Promise<string> {
  ensureIOS('Apple Music user token');

  const developerToken = getAppleDeveloperTokenOrThrow();

  try {
    const token = await AppleMusicAuth.getUserToken(developerToken);
    return token;
  } catch (error) {
    throw mapAppleMusicError(error);
  }
}

export async function runAppleMusicDebugFlow(): Promise<AppleMusicDebugResult> {
  const payloads: MusicDebugPayload[] = [];

  const authorizationStatus = await requestAppleMusicAuthorization();

  payloads.push({
    label: 'Apple Music: Authorization',
    data: { status: authorizationStatus },
    fixturePath: 'docs/fixtures/appleMusic/authorize.json',
  });

  if (authorizationStatus !== 'authorized') {
    return { payloads };
  }

  let musicUserToken: string | null = null;

  try {
    musicUserToken = await getAppleMusicUserToken();
  } catch (error) {
    payloads.push({
      label: 'Apple Music: Music User Token (FAILED)',
      data: serializeAppleMusicError(error),
      fixturePath: 'docs/fixtures/errors/appleMusic-user-token.json',
    });

    return { payloads };
  }

  const tokenPreview =
    musicUserToken.length > 10
      ? `${musicUserToken.slice(0, 6)}...${musicUserToken.slice(-4)}`
      : '***redacted***';

  payloads.push({
    label: 'Apple Music: Music User Token (metadata only)',
    data: {
      preview: tokenPreview,
      length: musicUserToken.length,
    },
    fixturePath: 'docs/fixtures/appleMusic/user-token.json',
  });

  const developerToken = getAppleDeveloperTokenOrThrow();

  await appendRecentPlayedPayloads({
    developerToken,
    musicUserToken,
    payloads,
  });

  await appendCatalogSearchPayloads({
    developerToken,
    payloads,
  });

  return { payloads };
}

async function appendRecentPlayedPayloads({
  developerToken,
  musicUserToken,
  payloads,
}: {
  developerToken: string;
  musicUserToken: string;
  payloads: MusicDebugPayload[];
}) {
  try {
    const recentPlayedResponse = await fetch(`${APPLE_MUSIC_API_BASE}/me/recent/played/tracks`, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        'Music-User-Token': musicUserToken,
      },
    });

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

async function appendCatalogSearchPayloads({
  developerToken,
  payloads,
}: {
  developerToken: string;
  payloads: MusicDebugPayload[];
}) {
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
}

function serializeAppleMusicError(error: unknown): JsonValue {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as NativeAppleMusicError).code ?? 'UNKNOWN',
    };
  }

  return {
    message: 'Unknown error',
    detail: JSON.stringify(error),
  };
}
