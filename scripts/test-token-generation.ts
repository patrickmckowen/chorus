/**
 * Quick test to verify developer token generation works
 * This doesn't require a user token
 */

import 'dotenv/config';
import { generateDeveloperToken } from '../src/services/apple-music';

async function testTokenGeneration() {
	console.log('🔑 Testing Developer Token Generation\n');
	console.log('='.repeat(50));
	console.log();

	const teamId = process.env.APPLE_MUSIC_TEAM_ID;
	const keyId = process.env.APPLE_MUSIC_KEY_ID;
	const privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;

	if (!teamId || !keyId || !privateKey) {
		console.log('❌ Missing credentials in .env file');
		console.log('   Required: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY');
		process.exit(1);
	}

	try {
		console.log('📝 Generating developer token...');
		const token = generateDeveloperToken({
			teamId,
			keyId,
			privateKey,
		});

		console.log('✅ Token generated successfully!');
		console.log(`   Token length: ${token.length} characters`);
		console.log(`   Token preview: ${token.substring(0, 50)}...`);
		console.log();
		console.log('💡 Next step: Use this token to get a user token');
		console.log('   Open scripts/get-user-token.html in your browser');
		console.log('='.repeat(50));
	} catch (error) {
		console.log('❌ Token generation failed');
		console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
		console.log('='.repeat(50));
		process.exit(1);
	}
}

testTokenGeneration();

