/**
 * TypeScript interfaces for Apple Music API responses
 */

/**
 * Normalized track activity matching the data model from AGENTS.md
 */
export interface TrackActivity {
	id: string;
	userId: string;
	trackName: string;
	artistName: string;
	albumArtUrl: string;
	source: 'appleMusic';
	timestamp: number;
}

/**
 * Apple Music API Song response
 */
export interface AppleMusicSong {
	id: string;
	type: 'songs';
	attributes: {
		name: string;
		artistName: string;
		albumName?: string;
		artwork?: {
			url: string;
			width: number;
			height: number;
		};
		durationInMillis?: number;
		playParams?: {
			id: string;
			kind: string;
		};
	};
	relationships?: {
		albums?: {
			data: Array<{
				id: string;
				type: 'albums';
				attributes: {
					name: string;
					artwork?: {
						url: string;
						width: number;
						height: number;
					};
				};
			}>;
		};
	};
}

/**
 * Apple Music API response for recently played tracks
 */
export interface AppleMusicRecentlyPlayedResponse {
	data: AppleMusicSong[];
	next?: string;
}

/**
 * Apple Music API user response
 */
export interface AppleMusicUser {
	id: string;
	type: 'users';
	attributes?: {
		name?: string;
	};
}

/**
 * Apple Music API user response wrapper
 */
export interface AppleMusicUserResponse {
	data: AppleMusicUser[];
}

/**
 * Configuration for Apple Music service
 */
export interface AppleMusicConfig {
	teamId: string;
	keyId: string;
	privateKey: string;
	developerToken?: string;
	userToken?: string;
}

