/**
 * Apple Music API client wrapper
 */

import { AppleMusicAuth } from './auth';
import {
	AppleMusicRecentlyPlayedResponse,
	AppleMusicSong,
	AppleMusicUserResponse,
	TrackActivity,
} from './types';

const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1';

/**
 * Apple Music API client
 */
export class AppleMusicClient {
	private auth: AppleMusicAuth;
	private userId: string = 'current-user'; // Default, can be overridden

	constructor(auth: AppleMusicAuth) {
		this.auth = auth;
	}

	/**
	 * Make an authenticated request to Apple Music API
	 */
	private async makeRequest<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const developerToken = this.auth.getDeveloperToken();
		const userToken = this.auth.getUserToken();

		if (!userToken) {
			throw new Error(
				'User token is required. User must be authorized before making API requests.'
			);
		}

		const url = `${APPLE_MUSIC_API_BASE}${endpoint}`;
		const headers: HeadersInit = {
			Authorization: `Bearer ${developerToken}`,
			'Music-User-Token': userToken,
			'Content-Type': 'application/json',
			...options.headers,
		};

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Apple Music API error (${response.status}): ${errorText || response.statusText}`
			);
		}

		return response.json();
	}

	/**
	 * Get the current authenticated user
	 */
	async getCurrentUser(): Promise<{ id: string; name?: string }> {
		try {
			const response = await this.makeRequest<AppleMusicUserResponse>('/me');
			const user = response.data[0];
			if (user) {
				this.userId = user.id;
				return {
					id: user.id,
					name: user.attributes?.name,
				};
			}
			throw new Error('No user data returned from API');
		} catch (error) {
			throw new Error(
				`Failed to get current user: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Normalize Apple Music song to TrackActivity format
	 */
	private normalizeTrack(song: AppleMusicSong, userId: string): TrackActivity {
		// Get album art URL - try from song attributes first, then from relationships
		let albumArtUrl = '';
		if (song.attributes.artwork?.url) {
			// Replace {w} and {h} placeholders with actual dimensions
			albumArtUrl = song.attributes.artwork.url
				.replace('{w}', String(song.attributes.artwork.width || 300))
				.replace('{h}', String(song.attributes.artwork.height || 300));
		} else if (song.relationships?.albums?.data?.[0]?.attributes?.artwork?.url) {
			const artwork = song.relationships.albums.data[0].attributes.artwork;
			albumArtUrl = artwork.url
				.replace('{w}', String(artwork.width || 300))
				.replace('{h}', String(artwork.height || 300));
		}

		// Use current timestamp if not available from API
		const timestamp = Date.now();

		return {
			id: song.id,
			userId,
			trackName: song.attributes.name,
			artistName: song.attributes.artistName,
			albumArtUrl,
			source: 'appleMusic',
			timestamp,
		};
	}

	/**
	 * Get recently played tracks
	 * @param limit - Maximum number of tracks to retrieve (default: 25, max: 100)
	 */
	async getRecentlyPlayedTracks(limit: number = 25): Promise<TrackActivity[]> {
		try {
			if (!this.auth.isAuthorized()) {
				throw new Error('User must be authorized before fetching recently played tracks');
			}

			// Get user ID if not already set
			if (this.userId === 'current-user') {
				await this.getCurrentUser();
			}

			const params = new URLSearchParams({
				limit: String(Math.min(limit, 100)), // API max is 100
			});

			const response = await this.makeRequest<AppleMusicRecentlyPlayedResponse>(
				`/me/recent/played/tracks?${params.toString()}`
			);

			return response.data.map((song) => this.normalizeTrack(song, this.userId));
		} catch (error) {
			throw new Error(
				`Failed to get recently played tracks: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

