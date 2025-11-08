<!-- 4459ce47-0771-44cf-89b3-494c81517f73 c87abfb3-fcbe-42bc-89c1-4a65983f6f8c -->
# Apple Music POC Implementation Plan

## Overview

Build a proof of concept that demonstrates Apple Music authentication and displays recently played tracks in a Profile screen. This validates the Apple Music API integration works end-to-end.

## Key Issues to Address

1. **JWT Generation**: `jsonwebtoken` doesn't work in React Native - developer token must be generated server-side
2. **Platform Authorization**: Need iOS-specific implementation for user token retrieval
3. **Token Storage**: Use `expo-secure-store` for secure token persistence
4. **Service Integration**: Wire up existing Apple Music service to Profile screen

## Implementation Steps

### 1. Create Profile Screen (`src/screens/ProfileScreen.tsx`)

- Create new Profile screen component
- Add UI for:
- "Connect Apple Music" button (when not authorized)
- Loading state during authorization
- List of recently played tracks with:
- Album artwork (using Image component)
- Track name and artist
- Timestamp
- Error states for failed auth or API calls
- Use React Native components: `ScrollView`, `FlatList`, `Image`, `Text`, `TouchableOpacity`

### 2. Add Profile Screen to Navigation (`src/navigation/index.tsx`)

- Import ProfileScreen
- Add Profile route to Stack.Navigator
- Add navigation button/link from HomeScreen to Profile (optional for POC)

### 3. Create Apple Music Auth Hook (`src/hooks/useAppleMusicAuth.ts`)

- Custom hook to manage Apple Music authentication state
- Functions:
- `initialize()` - Initialize auth with config from appConfig
- `authorize()` - Trigger platform-specific authorization
- `isAuthorized()` - Check authorization status
- `getUserToken()` - Retrieve stored user token
- Use `expo-secure-store` to persist:
- Developer token (with expiration check)
- User token
- Handle token refresh for developer token (24hr expiration)

### 4. Implement iOS Authorization (`src/services/apple-music/auth.ts`)

- Update `authorizeUser()` method with iOS implementation
- For iOS: Use native module approach or `@superfan-app/apple-music-auth` library
- Alternative: Create Expo module wrapper for `SKCloudServiceController`
- Store user token in secure storage after successful authorization

### 5. Create Developer Token Service (`src/services/apple-music/token-service.ts`)

- New service to handle developer token generation
- For POC: Create simple backend endpoint or use environment variable
- Alternative: Document that developer token should be generated server-side
- Implement token caching with expiration checking
- Store in `expo-secure-store` with expiration timestamp

### 6. Update Apple Music Auth Class (`src/services/apple-music/auth.ts`)

- Modify to use secure storage instead of in-memory config
- Load tokens from secure storage on initialization
- Implement token refresh logic for developer token
- Update `initialize()` to fetch developer token from backend or use cached version

### 7. Create Profile Screen Logic (`src/screens/ProfileScreen.tsx`)

- Use `useAppleMusicAuth` hook
- Implement `handleConnectAppleMusic()` function:
- Check if already authorized
- If not, trigger authorization flow
- On success, fetch recently played tracks
- Implement `fetchRecentlyPlayedTracks()` function:
- Use `AppleMusicClient` to get tracks
- Handle loading and error states
- Store tracks in component state
- Display tracks in a scrollable list

### 8. Update App Config for Backend Token Generation (`app.config.ts`)

- Add `APPLE_MUSIC_TOKEN_ENDPOINT` environment variable (optional)
- Or document that developer token should be provided via environment variable for POC

### 9. Handle JWT Generation Issue

**Option A (Recommended for POC)**: Create simple backend endpoint

- Create minimal Express/Node.js endpoint that generates developer token
- Endpoint accepts credentials, returns JWT token
- Client calls this endpoint to get developer token

**Option B**: Use environment variable for pre-generated token

- Document that developer token must be generated server-side
- Store in environment variable for development
- Client reads from config (not secure, but acceptable for POC)

### 10. Add Error Handling and Loading States

- Handle network errors gracefully
- Show user-friendly error messages
- Implement retry logic for failed API calls
- Add loading indicators during auth and data fetching

### 11. Update HomeScreen (Optional)

- Add navigation button to Profile screen
- Or update "Connect Apple Music" button to navigate to Profile

## Files to Create/Modify

**New Files:**

- `src/screens/ProfileScreen.tsx` - Profile screen component
- `src/hooks/useAppleMusicAuth.ts` - Authentication hook
- `src/services/apple-music/token-service.ts` - Token management service

**Modified Files:**

- `src/navigation/index.tsx` - Add Profile route
- `src/services/apple-music/auth.ts` - Implement platform authorization, use secure storage
- `src/screens/HomeScreen.tsx` - Add navigation to Profile (optional)

**Configuration:**

- `app.config.ts` - Add token endpoint config (if using backend)
- `package.json` - Add `@superfan-app/apple-music-auth` if using library approach

## Testing Approach

1. Test on iOS simulator/device (Apple Music auth requires real device or simulator with Apple ID)
2. Verify token storage in secure store
3. Test authorization flow
4. Verify recently played tracks display correctly
5. Test error scenarios (no network, denied authorization, etc.)

## Notes

- For POC, focus on iOS platform first (Android Apple Music support is limited)
- Developer token generation must happen server-side due to React Native limitations
- User token requires actual Apple Music subscription and user authorization
- This is a proof of concept - production implementation would need additional security hardening

### To-dos

- [ ] Create ProfileScreen component with UI for authorization button and track list display
- [ ] Add Profile screen route to navigation stack
- [ ] Create useAppleMusicAuth hook to manage authentication state and secure token storage
- [ ] Implement iOS-specific authorization in auth.ts using native module or library
- [ ] Create token service to handle developer token generation/caching with secure storage
- [ ] Update AppleMusicAuth class to use secure storage and implement token refresh
- [ ] Wire up ProfileScreen with auth hook and AppleMusicClient to fetch and display tracks
- [ ] Set up backend endpoint or environment-based approach for developer token generation
- [ ] Add comprehensive error handling and loading states throughout the flow