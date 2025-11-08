# Apple Music API Setup Guide

This guide will walk you through setting up Apple Music API access for the Chorus app.

## Prerequisites

- Active Apple Developer Program membership ($99/year)
- Access to [Apple Developer Portal](https://developer.apple.com/account/)

## Step 1: Create a MusicKit Identifier

1. Log in to the [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click on **Identifiers** in the left sidebar
4. Click the **+** button to create a new identifier
5. Select **Services IDs** and click **Continue**
6. Enter a description (e.g., "Chorus MusicKit Service")
7. Enter an identifier (e.g., `com.patrickmckowen.chorus.musickit`)
8. Click **Continue** and then **Register**

## Step 2: Generate a Private Key

1. In the Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
2. Click on **Keys** in the left sidebar
3. Click the **+** button to create a new key
4. Enter a key name (e.g., "Chorus MusicKit Key")
5. Check the **MusicKit** checkbox
6. Click **Continue** and then **Register**
7. **Important**: Download the key file (`.p8` file) immediately - you can only download it once!
8. Note the **Key ID** displayed on the page

## Step 3: Get Your Team ID

1. In the Apple Developer Portal, go to **Membership** (or click on your name/account in the top right)
2. Your **Team ID** is displayed on this page (it's a 10-character alphanumeric string)

## Step 4: Configure Environment Variables

Create a `.env` file in the root of your project (or add to your existing `.env` file):

```bash
# Apple Music API Configuration
APPLE_MUSIC_TEAM_ID=your-team-id-here
APPLE_MUSIC_KEY_ID=your-key-id-here
APPLE_MUSIC_PRIVATE_KEY=path/to/your/AuthKey_KEYID.p8
```

### Option 1: Private Key File Path

If you have the `.p8` file saved locally:

```bash
APPLE_MUSIC_PRIVATE_KEY=/path/to/AuthKey_KEYID.p8
```

### Option 2: Private Key Content (for serverless environments)

If you need to provide the key content directly (e.g., for serverless functions):

```bash
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
...
-----END PRIVATE KEY-----"
```

**Security Note**: Never commit your `.env` file or private key to version control. The `.env` file is already in `.gitignore`.

## Step 5: Obtain User Token

The user token is required to access user-specific data like recently played tracks. The method to obtain this depends on your platform:

### For Web (MusicKit JS)

1. Load MusicKit JS library in your HTML:
   ```html
   <script src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"></script>
   ```

2. Initialize MusicKit with your developer token:
   ```javascript
   const music = await MusicKit.configure({
     developerToken: 'YOUR_DEVELOPER_TOKEN',
     app: {
       name: 'Chorus',
       build: '1.0.0'
     }
   });
   ```

3. Request user authorization:
   ```javascript
   const userToken = await music.authorize();
   ```

4. Use the user token in your API calls or set it as an environment variable for the validation script:
   ```bash
   APPLE_MUSIC_USER_TOKEN=your-user-token-here
   ```

### For iOS (Native)

Use `SKCloudServiceController` to request a user token:

```swift
import StoreKit

let controller = SKCloudServiceController()
controller.requestUserToken(forDeveloperToken: developerToken) { userToken, error in
    if let userToken = userToken {
        // Use userToken for API requests
    } else if let error = error {
        // Handle error
    }
}
```

### For Validation Script

For the validation script, you can provide the user token directly via environment variable:

```bash
APPLE_MUSIC_USER_TOKEN=your-user-token-here
```

**Note**: The user token is obtained after the user authorizes your app to access their Apple Music account. This requires user interaction and cannot be automated.

## Step 6: Run the Validation Script

Once you have all the required environment variables set:

```bash
npm run validate-apple-music
```

The script will:
1. Generate a developer token from your credentials
2. Initialize the Apple Music client
3. Fetch the current user
4. Retrieve recently played tracks
5. Display the results

## Troubleshooting

### Error: "Missing required Apple Music credentials"

- Ensure all environment variables are set in your `.env` file
- Verify the variable names match exactly: `APPLE_MUSIC_TEAM_ID`, `APPLE_MUSIC_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY`

### Error: "Failed to read private key file"

- Verify the path to your `.p8` file is correct
- Ensure the file exists and is readable
- If using key content directly, ensure it includes the full key with headers and newlines

### Error: "User token is required"

- You must obtain a user token through user authorization (MusicKit JS or platform-specific API)
- For testing, you can temporarily set `APPLE_MUSIC_USER_TOKEN` in your `.env` file if you already have one

### Error: "Apple Music API error (401)"

- Verify your developer token is valid (tokens expire after 24 hours)
- Check that your Team ID, Key ID, and private key are correct
- Ensure the key has MusicKit permissions enabled

### Error: "Apple Music API error (403)"

- Verify the user token is valid
- Ensure the user has authorized your app
- Check that your MusicKit identifier is properly configured

## Additional Resources

- [Apple MusicKit Documentation](https://developer.apple.com/documentation/musickit)
- [Apple MusicKit JS Documentation](https://developer.apple.com/documentation/musickitjs)
- [Apple Developer Portal](https://developer.apple.com/account/)

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file in `.gitignore`
2. **Rotate keys regularly**: Generate new keys periodically for security
3. **Use secure storage**: In production, use secure storage solutions (e.g., `expo-secure-store`) for tokens
4. **Limit token scope**: Only request the minimum permissions needed
5. **Monitor API usage**: Keep track of API calls to avoid rate limits

