/**
 * Apple Music authentication flow
 */

import { Platform } from 'react-native';
import { AppleMusicConfig } from './types';
import { TokenService } from './token-service';

/**
 * Apple Music authentication manager
 */
export class AppleMusicAuth {
	private config: AppleMusicConfig;
	private tokenService: TokenService;
	private developerToken: string | null = null;

	constructor(config: AppleMusicConfig) {
		this.config = config;
		this.tokenService = new TokenService();
	}

	/**
	 * Initialize auth - load tokens from secure storage and get developer token
	 */
	async initialize(): Promise<string> {
		try {
			// Load user token from secure storage if available
			const storedUserToken = await this.tokenService.getUserToken();
			if (storedUserToken) {
				this.config.userToken = storedUserToken;
			}

			// Get developer token (from cache or generate new)
			this.developerToken = await this.tokenService.getDeveloperToken(this.config);
			return this.developerToken;
		} catch (error) {
			throw new Error(
				`Failed to initialize Apple Music auth: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Get the current developer token
	 */
	getDeveloperToken(): string {
		if (!this.developerToken) {
			throw new Error('Developer token not initialized. Call initialize() first.');
		}
		return this.developerToken;
	}

	/**
	 * Set user token (obtained from user authorization) and store securely
	 */
	async setUserToken(userToken: string): Promise<void> {
		this.config.userToken = userToken;
		await this.tokenService.storeUserToken(userToken);
	}

	/**
	 * Get user token
	 */
	getUserToken(): string | undefined {
		return this.config.userToken;
	}

	/**
	 * Check if user is authorized
	 */
	isAuthorized(): boolean {
		return !!this.config.userToken;
	}

	/**
	 * Authorize user - platform-specific implementation
	 * For iOS: Uses SKCloudServiceController (requires native module)
	 * For POC: Can use environment variable or manual token entry
	 */
	async authorizeUser(): Promise<string> {
		if (Platform.OS === 'ios') {
			return this.authorizeUserIOS();
		} else if (Platform.OS === 'android') {
			throw new Error('Apple Music authorization is not supported on Android');
		} else {
			throw new Error(
				'Apple Music authorization is only supported on iOS. ' +
					'For web, use MusicKit JS.'
			);
		}
	}

	/**
	 * iOS-specific authorization using SKCloudServiceController
	 * This requires a native module wrapper or library
	 * For POC, we'll provide a basic implementation that can be enhanced
	 */
	private async authorizeUserIOS(): Promise<string> {
		// For POC, we'll check if there's a user token in environment
		// In production, this should use a native module to call SKCloudServiceController
		if (this.config.userToken) {
			await this.setUserToken(this.config.userToken);
			return this.config.userToken;
		}

		// TODO: Implement native module integration
		// For now, throw an error with instructions
		throw new Error(
			'iOS authorization requires a native module implementation. ' +
				'For POC testing, you can set APPLE_MUSIC_USER_TOKEN in your environment variables. ' +
				'To implement native authorization, create an Expo module that wraps SKCloudServiceController.'
		);
	}

	/**
	 * Clear all stored tokens
	 */
	async clearTokens(): Promise<void> {
		await this.tokenService.clearUserToken();
		await this.tokenService.clearDeveloperToken();
		this.config.userToken = undefined;
		this.developerToken = null;
	}
}

