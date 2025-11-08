import Constants from 'expo-constants';

type ExtraConfig = {
	API_URL?: string;
	APPLE_MUSIC_TEAM_ID?: string;
	APPLE_MUSIC_KEY_ID?: string;
	APPLE_MUSIC_PRIVATE_KEY?: string;
	APPLE_MUSIC_USER_TOKEN?: string;
	APPLE_MUSIC_DEVELOPER_TOKEN?: string;
	APPLE_MUSIC_TOKEN_ENDPOINT?: string;
};

const extra = (Constants?.expoConfig?.extra as ExtraConfig | undefined) ?? ({} as ExtraConfig);

export const appConfig = {
	apiUrl: extra.API_URL ?? 'https://example.com',
	appleMusic: {
		teamId: extra.APPLE_MUSIC_TEAM_ID,
		keyId: extra.APPLE_MUSIC_KEY_ID,
		privateKey: extra.APPLE_MUSIC_PRIVATE_KEY,
		userToken: extra.APPLE_MUSIC_USER_TOKEN,
		developerToken: extra.APPLE_MUSIC_DEVELOPER_TOKEN,
		tokenEndpoint: extra.APPLE_MUSIC_TOKEN_ENDPOINT,
	},
};


