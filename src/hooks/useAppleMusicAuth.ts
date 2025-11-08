/**
 * Custom hook for managing Apple Music authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { AppleMusicAuth } from 'services/apple-music';
import { AppleMusicConfig } from 'services/apple-music/types';
import { appConfig } from 'lib/config';

interface UseAppleMusicAuthReturn {
	auth: AppleMusicAuth | null;
	isAuthorized: boolean;
	isInitializing: boolean;
	isAuthorizing: boolean;
	error: string | null;
	initialize: () => Promise<void>;
	authorize: () => Promise<void>;
	clearAuth: () => Promise<void>;
}

/**
 * Hook to manage Apple Music authentication state
 */
export function useAppleMusicAuth(): UseAppleMusicAuthReturn {
	const [auth, setAuth] = useState<AppleMusicAuth | null>(null);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Initialize Apple Music auth with config
	 */
	const initialize = useCallback(async () => {
		if (!appConfig.appleMusic.teamId || !appConfig.appleMusic.keyId || !appConfig.appleMusic.privateKey) {
			setError('Apple Music credentials not configured');
			setIsInitializing(false);
			return;
		}

		try {
			setError(null);
			setIsInitializing(true);

			const config: AppleMusicConfig & { tokenEndpoint?: string } = {
				teamId: appConfig.appleMusic.teamId!,
				keyId: appConfig.appleMusic.keyId!,
				privateKey: appConfig.appleMusic.privateKey!,
				userToken: appConfig.appleMusic.userToken,
				developerToken: appConfig.appleMusic.developerToken, // For POC, can be pre-generated
				tokenEndpoint: appConfig.appleMusic.tokenEndpoint, // Optional backend endpoint
			};

			const authInstance = new AppleMusicAuth(config);
			await authInstance.initialize();

			setAuth(authInstance);
			setIsAuthorized(authInstance.isAuthorized());
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Apple Music auth';
			setError(errorMessage);
			console.error('Failed to initialize Apple Music auth:', err);
		} finally {
			setIsInitializing(false);
		}
	}, []);

	/**
	 * Authorize user
	 */
	const authorize = useCallback(async () => {
		if (!auth) {
			setError('Auth not initialized. Call initialize() first.');
			return;
		}

		try {
			setError(null);
			setIsAuthorizing(true);

			const userToken = await auth.authorizeUser();
			await auth.setUserToken(userToken);

			setIsAuthorized(true);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to authorize user';
			setError(errorMessage);
			console.error('Failed to authorize user:', err);
		} finally {
			setIsAuthorizing(false);
		}
	}, [auth]);

	/**
	 * Clear authentication
	 */
	const clearAuth = useCallback(async () => {
		if (!auth) {
			return;
		}

		try {
			await auth.clearTokens();
			setIsAuthorized(false);
			setError(null);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to clear auth';
			setError(errorMessage);
			console.error('Failed to clear auth:', err);
		}
	}, [auth]);

	// Initialize on mount
	useEffect(() => {
		initialize();
	}, [initialize]);

	return {
		auth,
		isAuthorized,
		isInitializing,
		isAuthorizing,
		error,
		initialize,
		authorize,
		clearAuth,
	};
}

