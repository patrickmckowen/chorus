# Music Auth Fixtures

This directory contains captured authentication payloads from Spotify and Apple Music for reference during development.

## Directory Structure

- `spotify/` - Spotify API responses
- `appleMusic/` - Apple Music API responses  
- `errors/` - Error payloads for debugging

## Usage

1. Run the app: `npm run ios`
2. Navigate to `/proto-auth` route
3. Complete authentication flows
4. Copy JSON payloads from screen to appropriate subdirectories

## Expected Files

### Spotify
- `auth.json` - Token exchange response
- `me.json` - User profile from `/v1/me`
- `currently-playing.json` - Current playback from `/v1/me/player/currently-playing`

### Apple Music
- `authorize.json` - MusicKit authorization response
- `recent-played.json` - Recent tracks from `/v1/me/recent/played/tracks`
- Additional catalog/library responses as needed

## Notes

- Payloads are used to design the normalized `TrackActivity` interface
- All tokens and sensitive data should be sanitized before committing
- Delete `/proto-auth` screen after fixtures are captured

