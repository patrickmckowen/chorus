# AUTH.md — Authentication System Documentation

## Overview

Chorus currently implements **Apple Sign-In only** as the primary authentication method. The implementation is minimal and does not include token storage, session persistence, or backend integration. This document outlines the current state, constraints, and guidelines for safely extending authentication.

---

## Current Implementation

### Apple Sign-In

**Location:** `src/screens/WelcomeScreen.tsx`

**Package:** `expo-apple-authentication` v8.0.7

**Flow:**
1. Check availability via `AppleAuthentication.isAvailableAsync()` (iOS only)
2. User taps Apple Sign-In button
3. `handleSignIn()` calls `AppleAuthentication.signInAsync()` with scopes:
   - `FULL_NAME`
   - `EMAIL`
4. On success: Extract user name from credential and navigate to `Profile` screen
5. On error: Handle `ERR_CANCELED` silently; show alert for other errors

**Key Code:**
```19:41:src/screens/WelcomeScreen.tsx
	const handleSignIn = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});

			const fullName = credential.fullName;
			const userName = fullName
				? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() || 'User'
				: 'User';

			navigation.navigate('Profile', { userName });
		} catch (e) {
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_CANCELED') {
				// User canceled, do nothing
				return;
			}
			Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
		}
	};
```

---

## Configuration

**Required Setup:**

1. **`app.config.ts`:**
   - `ios.usesAppleSignIn: true` (line 22)
   - `plugins: ['expo-apple-authentication']` (line 36)
   - Bundle identifier: `com.patrickmckowen.chorus`

2. **iOS Entitlements:**
   - Apple Sign-In capability must be enabled in Xcode project

---

## Key Constraints & Limitations

**Current State:**
- ✅ Apple Sign-In implemented (iOS only)
- ❌ No token storage or session persistence
- ❌ No backend integration (Supabase auth not connected)
- ❌ No auth state management (Zustand/Context not set up)
- ❌ No Spotify OAuth (placeholder button in `HomeScreen`)
- ❌ No Apple MusicKit authentication (placeholder button in `HomeScreen`)
- ❌ No user ID or credential storage
- ❌ Navigation-based auth flow (no protected routes)

**Platform Limitations:**
- Apple Sign-In only available on iOS devices
- `isAvailableAsync()` check prevents button display on unsupported platforms

---

## Planned Extensions

Per `AGENTS.md`, the following are planned:

1. **Spotify OAuth** — OAuth 2.0 flow for Spotify account linking
2. **Apple MusicKit Authentication** — MusicKit JS integration for Apple Music
3. **Supabase Integration** — Backend auth and user management
4. **State Management** — Zustand or React Context for auth state
5. **Token Storage** — Secure storage of access/refresh tokens in User model
6. **Protected Routes** — Navigation guards based on auth state

---

## Safe Extension Guidelines

### Adding New Auth Providers

**Location:** Create new auth providers in `/src/services/` or `/src/features/Auth/`

**Pattern:**
- Each provider should have its own service module with a common interface
- Follow the decoupled data layer principle from `AGENTS.md`
- Handle errors gracefully (user cancellation, network failures, etc.)

**Example Structure:**
```
/src/services/
  /auth/
    appleAuth.ts      (existing logic)
    spotifyAuth.ts    (to be added)
    appleMusicAuth.ts (to be added)
    index.ts          (common interface)
```

### Token Storage

**Current:** No tokens are stored.

**Future Pattern:**
- Store tokens in Supabase user record (see `AGENTS.md` User model)
- Use secure storage (e.g., `expo-secure-store`) for sensitive tokens
- Implement token refresh logic for OAuth providers
- Never store tokens in AsyncStorage or unencrypted storage

**User Model Reference:**
```ts
linkedServices: {
  spotify?: { accessToken: string; refreshToken: string };
  appleMusic?: { musicUserToken: string };
}
```

### State Management Integration

**Current:** No global auth state.

**Integration Points:**
- Add auth state to Zustand store or React Context
- Track: `isAuthenticated`, `currentUser`, `linkedServices`
- Persist auth state across app restarts
- Update navigation to use auth state (protected routes)

**Navigation Changes:**
- Modify `src/navigation/index.tsx` to conditionally render `Welcome` vs `Home` based on auth state
- Consider adding auth state check in `App.tsx` or navigation setup

### Backend Integration (Supabase)

**Current:** No backend connection.

**Integration Steps:**
1. Set up Supabase project and client
2. Configure Supabase Auth (may replace or complement Apple Sign-In)
3. Store user data in Supabase database
4. Sync `linkedServices` tokens to Supabase user record
5. Use Supabase Realtime for auth state synchronization

**Important:**
- Do not break existing Apple Sign-In flow during integration
- Maintain backward compatibility if migrating to Supabase Auth
- Consider hybrid approach: Apple Sign-In → Supabase user creation

---

## Critical Notes

1. **Error Handling:** Always handle `ERR_CANCELED` silently (user-initiated cancellation)
2. **Platform Checks:** Always check availability before showing auth buttons
3. **Privacy:** Only request scopes that are necessary (see `AGENTS.md` line 38-39)
4. **Token Security:** Never log or expose tokens in error messages or console
5. **Navigation:** Current flow navigates directly to `Profile` — this will need to change when adding protected routes

---

## Key Files

- `src/screens/WelcomeScreen.tsx` — Apple Sign-In implementation
- `app.config.ts` — Apple Sign-In configuration
- `src/navigation/index.tsx` — Navigation setup (initial route: `Welcome`)
- `AGENTS.md` — Architecture and data model reference

---

**Last Updated:** November 2025

