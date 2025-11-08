/**
 * Validation script for Apple Music service
 * Tests authentication and retrieval of recently played tracks
 */

import 'dotenv/config';
import { AppleMusicAuth, AppleMusicClient } from '../src/services/apple-music';

interface ValidationResult {
	success: boolean;
	message: string;
	tracks?: Array<{
		id: string;
		trackName: string;
		artistName: string;
		albumArtUrl: string;
		timestamp: number;
	}>;
	error?: string;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toISOString();
}

/**
 * Validate Apple Music service
 */
async function validateAppleMusic(): Promise<ValidationResult> {
	console.log('🎵 Apple Music Service Validation\n');
	console.log('=' .repeat(50));
	console.log();

	// Check for required environment variables
	const teamId = process.env.APPLE_MUSIC_TEAM_ID;
	const keyId = process.env.APPLE_MUSIC_KEY_ID;
	const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;
	const userToken = process.env.APPLE_MUSIC_USER_TOKEN;

	if (!teamId || !keyId || !privateKey) {
		return {
			success: false,
			message: 'Missing required Apple Music credentials',
			error:
				'Please set APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, and APPLE_MUSIC_PRIVATE_KEY environment variables.\n' +
				'See docs/APPLE_MUSIC_SETUP.md for instructions.',
		};
	}

	if (!userToken) {
		return {
			success: false,
			message: 'Missing user token',
			error:
				'Please set APPLE_MUSIC_USER_TOKEN environment variable.\n' +
				'User token must be obtained through user authorization (MusicKit JS or platform-specific API).',
		};
	}

	try {
		// Initialize authentication
		console.log('📝 Step 1: Initializing authentication...');
		const auth = new AppleMusicAuth({
			teamId,
			keyId,
			privateKey,
		});

		const developerToken = await auth.initialize();
		console.log('✅ Developer token generated successfully');
		console.log(`   Token preview: ${developerToken.substring(0, 20)}...`);
		console.log();

		// Set user token
		auth.setUserToken(userToken);
		console.log('✅ User token configured');
		console.log();

		// Create client
		console.log('📝 Step 2: Creating API client...');
		const client = new AppleMusicClient(auth);
		console.log('✅ API client created');
		console.log();

		// Get current user
		console.log('📝 Step 3: Fetching current user...');
		const user = await client.getCurrentUser();
		console.log(`✅ User authenticated: ${user.name || user.id}`);
		console.log(`   User ID: ${user.id}`);
		console.log();

		// Get recently played tracks
		console.log('📝 Step 4: Fetching recently played tracks...');
		const tracks = await client.getRecentlyPlayedTracks(25);
		console.log(`✅ Retrieved ${tracks.length} recently played tracks`);
		console.log();

		// Display tracks
		if (tracks.length > 0) {
			console.log('📊 Recently Played Tracks:');
			console.log('=' .repeat(50));
			tracks.forEach((track, index) => {
				console.log(`\n${index + 1}. ${track.trackName}`);
				console.log(`   Artist: ${track.artistName}`);
				console.log(`   Album Art: ${track.albumArtUrl || 'N/A'}`);
				console.log(`   Timestamp: ${formatTimestamp(track.timestamp)}`);
				console.log(`   ID: ${track.id}`);
			});
			console.log();
		} else {
			console.log('ℹ️  No recently played tracks found');
			console.log();
		}

		return {
			success: true,
			message: `Successfully retrieved ${tracks.length} recently played tracks`,
			tracks: tracks.map((track) => ({
				id: track.id,
				trackName: track.trackName,
				artistName: track.artistName,
				albumArtUrl: track.albumArtUrl,
				timestamp: track.timestamp,
			})),
		};
	} catch (error) {
		return {
			success: false,
			message: 'Validation failed',
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Main execution
 */
async function main() {
	try {
		const result = await validateAppleMusic();

		console.log('=' .repeat(50));
		if (result.success) {
			console.log('✅ VALIDATION SUCCESSFUL');
			console.log(`   ${result.message}`);
		} else {
			console.log('❌ VALIDATION FAILED');
			console.log(`   ${result.message}`);
			if (result.error) {
				console.log(`\n   Error details:\n   ${result.error}`);
			}
		}
		console.log('=' .repeat(50));

		process.exit(result.success ? 0 : 1);
	} catch (error) {
		console.error('💥 Unexpected error:', error);
		process.exit(1);
	}
}

// Run validation
main();

