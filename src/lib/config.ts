import Constants from 'expo-constants';

type ExtraConfig = {
  API_URL: string;
};

export const appConfig = {
  apiUrl:
    (Constants?.expoConfig?.extra as ExtraConfig | undefined)?.API_URL ?? 'https://example.com',
};
