import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { importPKCS8, SignJWT } from 'jose';

/**
 * Usage:
 *   node scripts/generate-apple-dev-token.mjs <TEAM_ID> <KEY_ID> <P8_FILE_PATH> [expirationDays]
 *
 * Example:
 *   node scripts/generate-apple-dev-token.mjs 9JMHZALFPZ 7X95A9J4UH /Users/you/Downloads/AuthKey_7X95A9J4UH.p8 180
 */
async function main() {
  const [teamId, keyId, p8PathArg, expirationDaysArg] = process.argv.slice(2);
  if (!teamId || !keyId || !p8PathArg) {
    console.error(
      'Usage: node scripts/generate-apple-dev-token.mjs <TEAM_ID> <KEY_ID> <P8_FILE_PATH> [expirationDays]'
    );
    process.exit(1);
  }

  const p8Path = path.resolve(p8PathArg);
  const expirationDays = Number.isFinite(Number(expirationDaysArg))
    ? Number(expirationDaysArg)
    : 180; // Max recommended by Apple is ~6 months

  const privateKeyPem = await readFile(p8Path, 'utf8');
  const privateKey = await importPKCS8(privateKeyPem, 'ES256');

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime(`${expirationDays}d`)
    .sign(privateKey);

  // Output only the token so it can be piped or copied easily
  process.stdout.write(jwt + '\n');
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});


