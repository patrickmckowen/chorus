# Music Auth Prototype Setup Guide

## Overview

The music authentication prototype has been implemented in `src/app/proto-auth.tsx`. This guide covers the setup steps needed to test the Spotify and Apple Music authentication flows.

## Prerequisites

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Spotify Configuration
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id

# Apple Music Configuration  
EXPO_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN=your-apple-music-developer-token
```

### 2. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app:
   - Name: **Chorus Dev**
   - Type: **Web API**
3. Add Redirect URIs in app settings:
   - `exp://127.0.0.1:8081`
   - `exp://localhost:8081`
   - `chorus://oauthredirect`
4. Copy your **Client ID** to `.env` as `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`
5. Verify **Authorization Code with PKCE** is enabled (default for mobile apps)

### 3. Apple Music Developer Setup

**Important:** The Media Services key must be linked to a **Media ID**, not your App ID. You'll need both an App ID (for your app) and a separate Media ID (for MusicKit services).

1. Access [Apple Developer Portal](https://developer.apple.com)
2. **Step 1: Create or verify your App ID** (for your app bundle):
   - Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
   - Create or find your App ID:
     - Click the **+** button to create a new identifier, or find existing one
     - **Bundle ID:** `com.patrickmckowen.chorus` (must match your app.config.ts)
     - **Description:** Chorus App
     - Under **Capabilities**, enable **MusicKit**
     - Click **Continue** and **Register**
3. **Step 2: Create a Media ID** (required for Media Services key):
   - Still in **Identifiers**, click the **+** button
   - Select **Media IDs** (not App IDs) and click **Continue**
   - **Description:** Chorus Media ID (or any descriptive name)
   - **Identifier:** Enter a reverse-domain style string (e.g., `media.com.patrickmckowen.chorus`)
   - Under **Services**, enable **MusicKit** (and optionally ShazamKit, Apple Music Feed)
   - Click **Continue** and **Register**
4. **Step 3: Create a Media Services Key**:
   - Navigate to **Keys** in the sidebar
   - Click the **+** button to create a new key
   - **Key Name:** Chorus MusicKit Key (or any descriptive name)
   - Check **Media Services (MusicKit, ShazamKit, Apple Music Feed)**
   - Click **Continue**
   - **Important:** Select the **Media ID** you created in Step 2 (not your App ID) from the dropdown
   - Click **Continue** and **Register**
   - Download the `.p8` private key file (you can only download it once!)
   - Note your **Key ID** and **Team ID** (shown on the key details page)
5. **Step 4: Generate a developer token**:
   - Option A: Use a local Node.js script with JWT signing (`jose` package)
   - Option B: Use an existing token generation service
   - The token must be signed with your `.p8` key using your Key ID and Team ID
6. Add the developer token to `.env` as `EXPO_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN`
7. Ensure your iOS device/simulator is signed in to Apple Music

## Running the Prototype

### 1. Install Dependencies

Dependencies have been installed. To verify:

```bash
npm install
```

### 2. Start the App

```bash
npm run ios
```

### 3. Navigate to Prototype Screen

In the app, navigate to the `/proto-auth` route.

### 4. Test Authentication Flows

#### Spotify Flow

1. Tap **"Authenticate Spotify"**
2. Complete the OAuth flow in the browser
3. View the returned JSON payloads on screen
4. Copy payloads to fixture files:
   - `docs/fixtures/spotify/auth.json` - Token response
   - `docs/fixtures/spotify/me.json` - User profile
   - `docs/fixtures/spotify/currently-playing.json` - Current playback

#### Apple Music Flow

1. Tap **"Authenticate Apple Music"**
2. Review the API structure (full implementation requires native MusicKit)
3. Copy any successful responses to:
   - `docs/fixtures/appleMusic/authorize.json`
   - `docs/fixtures/appleMusic/recent-played.json`

### 5. Capture Errors

If any errors occur, copy the error payloads to:
- `docs/fixtures/errors/spotify.json`
- `docs/fixtures/errors/appleMusic.json`

## Implementation Details

### Spotify Authentication

- Uses **expo-auth-session** with PKCE for secure OAuth flow
- Scopes requested:
  - `user-read-currently-playing`
  - `user-read-playback-state`
  - `user-read-recently-played`
  - `user-read-email`
  - `user-read-private`
- Fetches:
  - `/v1/me` - User profile
  - `/v1/me/player/currently-playing` - Current playback

### Apple Music Authentication

- Requires native MusicKit implementation for full functionality
- Shows proper API call structure for reference
- In production:
  1. Configure MusicKit with developer token
  2. Call `MusicKit.authorize()` to get music user token
  3. Use both tokens to fetch user data from `/v1/me/recent/played/tracks`

### Error Handling

All errors are captured and displayed on screen with the format:
```typescript
err instanceof Error ? err.message : JSON.stringify(err)
```

## Next Steps

1. Complete authentication flows and capture payloads
2. Review captured data in `docs/fixtures/`
3. Identify stable fields for the normalized `TrackActivity` interface
4. Design the data model based on both services' responses
5. **Delete** `src/app/proto-auth.tsx` after fixtures are complete
6. Scaffold `/src/services/spotify` and `/src/services/appleMusic` with shared interfaces

## Files Modified

- ✅ `src/app/proto-auth.tsx` - Prototype screen (NEW)
- ✅ `src/lib/config.ts` - Added Spotify and Apple Music config
- ✅ `app.config.ts` - Added Spotify redirect URI
- ✅ `docs/fixtures/` - Directory structure for payloads (NEW)
- ✅ `package.json` - Added expo-auth-session dependency

## Cleanup Reminder

**After capturing fixtures:**
- Delete `src/app/proto-auth.tsx`
- Remove music service config from `.env` (if no longer needed)
- Keep fixture files for reference during service implementation

---

**Last Updated:** November 2025

