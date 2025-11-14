import { appConfig } from 'lib/config';
import type { JsonValue, MusicDebugPayload } from './spotify';

export type AppleMusicDebugResult = {
  payloads: MusicDebugPayload[];
};

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

export async function runAppleMusicDebugFlow(): Promise<AppleMusicDebugResult> {
  const developerToken = appConfig.appleMusic.developerToken;

  if (!developerToken) {
    throw new Error('Apple Music Developer Token not configured in .env');
  }

  const payloads: MusicDebugPayload[] = [];

  // Step 1: Authorization structure (placeholder for native MusicKit)
  const authStructure: JsonValue = {
    note: 'Call MusicKit.authorize() here',
    returns: 'musicUserToken',
  };

  payloads.push({
    label: 'Apple Music: Authorization Structure',
    data: authStructure,
    fixturePath: 'docs/fixtures/appleMusic/authorize.json',
  });

  // Step 2: Example API call structure for recent played
  const apiCallExample: JsonValue = {
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

  // Step 3: Attempt a simple catalog search using only the developer token
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


