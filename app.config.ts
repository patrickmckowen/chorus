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
	extra: {
		API_URL: process.env.API_URL ?? 'https://example.com',
		APPLE_MUSIC_TEAM_ID: process.env.APPLE_MUSIC_TEAM_ID,
		APPLE_MUSIC_KEY_ID: process.env.APPLE_MUSIC_KEY_ID,
		APPLE_MUSIC_PRIVATE_KEY: process.env.APPLE_MUSIC_PRIVATE_KEY,
		APPLE_MUSIC_USER_TOKEN: process.env.APPLE_MUSIC_USER_TOKEN,
		APPLE_MUSIC_DEVELOPER_TOKEN: process.env.APPLE_MUSIC_DEVELOPER_TOKEN,
		APPLE_MUSIC_TOKEN_ENDPOINT: process.env.APPLE_MUSIC_TOKEN_ENDPOINT,
	},
});

