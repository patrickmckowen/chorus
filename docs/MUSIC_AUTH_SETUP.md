# Music Auth Prototype Setup Guide

## 1. Environment Variables

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

> **MusicKit requirements**
> - Enable the **MusicKit** capability for your app’s bundle identifier in the Apple Developer portal.
> - Set the Expo iOS deployment target to **15.0+** (`app.config.*`).
> - Use a real iOS device for debugging; MusicKit token retrieval does **not** work on the simulator.

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

### 3. Access Testing Interface

From the authenticated app, navigate to the music auth debug screen:

- Route: `/debug/music-auth`
- File: `src/app/debug/music-auth.tsx`

This screen provides buttons to run the Spotify and Apple Music debug flows and displays all captured payloads as collapsible JSON cards.

### 4. Test Authentication Flows

#### Spotify Flow

1. Tap **"Run Spotify Debug Flow"** button on the music auth debug screen
2. Complete the OAuth flow in the browser
3. View the success message and returned payload cards
4. Tap each payload card to expand and review the JSON
5. Tap **"📋 Copy JSON"** button on each card to copy to clipboard
6. Paste and save to the corresponding fixture file shown in the card:
   - `docs/fixtures/spotify/auth.json` - Token response
   - `docs/fixtures/spotify/me.json` - User profile
   - `docs/fixtures/spotify/currently-playing.json` - Current playback

#### Apple Music Flow

1. Tap **"Run Apple Music Debug Flow"** button on the music auth debug screen
2. On a properly configured iOS simulator/device (signed into Apple Music with a valid subscription/history), the app will:
   - Use a native Expo Module (`AppleMusicAuth`) backed by **MusicKit** to request authorization
   - Obtain a **Music User Token** using your JS-owned developer token
   - Call `/v1/me/recent/played/tracks` with both tokens to fetch your recent plays
3. Tap each payload card to expand and review the JSON
4. Tap **"📋 Copy JSON"** button on each card to copy to clipboard
5. Paste and save to the corresponding fixture file shown in the card (structure + metadata only, no raw tokens):
   - `docs/fixtures/appleMusic/authorize.json`
   - `docs/fixtures/appleMusic/user-token.json`
   - `docs/fixtures/appleMusic/recent-played.json`
   - `docs/fixtures/appleMusic/catalog-search.json`

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

- Uses a native Expo module (`AppleMusicAuth`) that splits work into:
  1. `requestAuthorization()` → wraps `MusicAuthorization.request()` and reports status
  2. `getUserToken(developerToken)` → calls `MusicUserTokenProvider.userToken(for:)`
- Both functions require a real iOS 15+ device with MusicKit entitlement enabled
- Debug flow then calls `/v1/me/recent/played/tracks` and `catalog/.../search` with the returned Music User Token

### Error Handling

All errors are captured and displayed on screen with the format:
```typescript
err instanceof Error ? err.message : JSON.stringify(err)
```

## Next Steps

1. Complete authentication flows and capture payloads using the music auth debug screen
2. Review captured data in `docs/fixtures/`
3. Identify stable fields for the normalized `TrackActivity` interface
4. Design the data model based on both services' responses
5. Keep the debug screen available for development until the normalization and TrackActivity-based flows are stable
6. Evolve `/src/services/music/spotify.ts` and `/src/services/music/appleMusic.ts` into reusable service modules for production flows

## Files Modified

- ✅ `src/app/debug/music-auth.tsx` - Dedicated music auth debug screen
- ✅ `src/app/(tabs)/home.tsx` - Restored to a simple home screen with a link to the debug screen
- ✅ `src/lib/config.ts` - Spotify and Apple Music config
- ✅ `app.config.ts` - Spotify redirect URI
- ✅ `docs/fixtures/` - Directory structure for payloads
- ✅ `package.json` - `expo-auth-session` dependency

## Cleanup Reminder

**After capturing fixtures and stabilizing the normalization layer:**
- You may choose to keep `src/app/debug/music-auth.tsx` for ongoing diagnostics, or remove it if no longer needed.
- Keep fixture files in `docs/fixtures/` for reference during service implementation and testing.

---

**Last Updated:** November 2025

