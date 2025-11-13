import Constants from 'expo-constants';

type ExtraConfig = {
  API_URL: string;
};

export const appConfig = {
  apiUrl:
    (Constants?.expoConfig?.extra as ExtraConfig | undefined)?.API_URL ?? 'https://example.com',
  spotify: {
    clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
  },
  appleMusic: {
    developerToken: process.env.EXPO_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN || '',
  },
};
