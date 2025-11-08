/**
 * Developer token generation utility for Apple Music API
 */

import * as jwt from 'jsonwebtoken';
import { AppleMusicConfig } from './types';

/**
 * Generate a JWT developer token for Apple Music API
 * @param config - Apple Music configuration with Team ID, Key ID, and private key
 * @returns JWT developer token string
 */
export function generateDeveloperToken(config: AppleMusicConfig): string {
	const { teamId, keyId, privateKey } = config;

	if (!teamId || !keyId || !privateKey) {
		throw new Error(
			'Missing required Apple Music credentials: Team ID, Key ID, and Private Key are required'
		);
	}

	// Parse the private key (handle both file path and direct key string)
	let privateKeyContent: string;
	if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
		// Private key is already a string (works in all environments)
		privateKeyContent = privateKey;
	} else {
		// Assume it's a file path - only works in Node.js environments
		// In React Native, provide the key content directly as a string
		if (typeof require !== 'undefined') {
			try {
				const fs = require('fs');
				privateKeyContent = fs.readFileSync(privateKey, 'utf8');
			} catch (error) {
				throw new Error(
					`Failed to read private key file: ${privateKey}. ` +
					`Error: ${error instanceof Error ? error.message : String(error)}. ` +
					`In React Native, provide the private key content directly as a string.`
				);
			}
		} else {
			throw new Error(
				`Private key appears to be a file path, but file system access is not available. ` +
				`In React Native, provide the private key content directly as a string in the format: ` +
				`"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"`
			);
		}
	}

	const now = Math.floor(Date.now() / 1000);
	const token = jwt.sign(
		{
			iss: teamId, // Issuer (Team ID)
			iat: now, // Issued at
			exp: now + 60 * 60 * 24, // Expires in 24 hours
		},
		privateKeyContent,
		{
			algorithm: 'ES256',
			header: {
				alg: 'ES256',
				kid: keyId, // Key ID
			},
		}
	);

	return token;
}

