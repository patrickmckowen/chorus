import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }) => ({
  ...config,
  name: 'chorus',
  slug: 'chorus',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  jsEngine: 'hermes',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.patrickmckowen.chorus',
    usesAppleSignIn: true,
    deploymentTarget: '15.0',
    infoPlist: {
      NSAppleMusicUsageDescription: 'Chorus uses Apple Music to read your listening history so we can show your music profile.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.patrickmckowen.chorus',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'chorus',
  plugins: [
    'expo-apple-authentication',
    'expo-router',
    './plugins/with-music-kit',
  ],
  extra: {
    API_URL: process.env.API_URL ?? 'https://example.com',
    spotifyRedirectUri: 'chorus://oauthredirect',
  },
});
