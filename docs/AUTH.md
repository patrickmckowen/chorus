# AUTH.md — Authentication System Documentation

## Overview

Chorus currently implements **Apple Sign-In with Supabase** as the primary authentication method. The implementation includes full session persistence, Supabase backend integration, and file-based route protection using Expo Router. This document outlines the current state, constraints, and guidelines for safely extending authentication.

---

## Current Implementation

### Apple Sign-In with Supabase

**Location:** `src/app/(auth)/welcome.tsx`

**Packages:** 
- `expo-apple-authentication` v8.0.7
- `@supabase/supabase-js` v2.80.0

**Flow:**
1. Check availability via `AppleAuthentication.isAvailableAsync()` (iOS only)
2. User taps Apple Sign-In button
3. `handleSignIn()` calls `AppleAuthentication.signInAsync()` with scopes:
   - `FULL_NAME`
   - `EMAIL`
4. Identity token is exchanged with Supabase via `signInWithIdToken`
5. User profile is upserted in Supabase `profiles` table with full name
6. Supabase session is created and persisted
7. Root layout auth guard automatically redirects to protected routes
8. On error: Handle `ERR_CANCELED` silently; show alert for other errors

**Key Code:**

```14:48:src/app/(auth)/welcome.tsx
	const handleSignIn = async () => {
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});

			if (!credential.identityToken) {
				throw new Error('No Apple identityToken');
			}

			const { data, error } = await supabase.auth.signInWithIdToken({
				provider: 'apple',
				token: credential.identityToken,
			});
			if (error) throw error;

			const user = data.user;

			const fullNameStr = `${credential.fullName?.givenName ?? ''} ${credential.fullName?.familyName ?? ''}`.trim();
			if (fullNameStr) {
				await supabase.from('profiles').upsert({ id: user.id, full_name: fullNameStr });
			}

			// Navigation will be handled by the root layout's auth state change
		} catch (e) {
			if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_CANCELED') {
				// User canceled, do nothing
				return;
			}
			Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
		}
	};
```

### Route Protection with Expo Router

**Location:** `src/app/_layout.tsx`

**Implementation:**
- Root layout monitors Supabase auth session state
- Uses `useSegments()` to detect current route group
- Implements auth guard logic:
  - Authenticated users in `(auth)` group → redirect to `/(tabs)/profile`
  - Unauthenticated users in `(tabs)` group → redirect to `/(auth)/welcome`
- Subscribes to auth state changes for automatic navigation
- Session checking happens on mount and whenever auth state changes

**Route Groups:**
- `(auth)/` — Unauthenticated routes (welcome, sign-in)
- `(tabs)/` — Protected routes requiring authentication (home, profile)

**Key Code:**

```10:39:src/app/_layout.tsx
	useEffect(() => {
		// Function to check auth and redirect
		const checkAuthAndRedirect = async () => {
			const { data } = await supabase.auth.getSession();
			const isAuthenticated = !!data.session;
			
			const inAuthGroup = segments[0] === '(auth)';
			const inTabsGroup = segments[0] === '(tabs)';

			if (isAuthenticated && inAuthGroup) {
				// Redirect authenticated users away from auth screens
				router.replace('/(tabs)/profile');
			} else if (!isAuthenticated && inTabsGroup) {
				// Redirect unauthenticated users away from protected screens
				router.replace('/(auth)/welcome');
			}
		};

		// Check initial auth state on mount
		checkAuthAndRedirect();

		// Subscribe to auth changes
		const unsub = subscribeToAuthChanges(() => {
			checkAuthAndRedirect();
		});
		
		return () => {
			if (unsub) unsub();
		};
	}, [router, segments]);
```

### Session Management

**Location:** `src/features/auth/session.ts`

**Implementation:**
- Provides `subscribeToAuthChanges()` helper for auth state subscriptions
- Uses Supabase `onAuthStateChange` listener
- Callback fires on sign-in, sign-out, and session updates

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

## Supabase Setup (Manual)

1. In Supabase Dashboard → Authentication → Providers → Apple:
   - Enable provider
   - Client ID: `com.patrickmckowen.chorus`
2. SQL (Profiles table + RLS):
   ```sql
   create table if not exists public.profiles (
     id uuid primary key references auth.users(id) on delete cascade,
     full_name text,
     avatar_url text,
     created_at timestamptz default now()
   );
   alter table public.profiles enable row level security;
   create policy "Profiles are viewable by owner" on public.profiles
   for select using ( auth.uid() = id );
   create policy "Profiles are insertable by owner" on public.profiles
   for insert with check ( auth.uid() = id );
   create policy "Profiles are updatable by owner" on public.profiles
   for update using ( auth.uid() = id );
   ```

## Key Constraints & Limitations

**Current State:**
- ✅ Apple Sign-In implemented (iOS only)
- ✅ Supabase backend integration with auth
- ✅ Session persistence via Supabase
- ✅ User profile storage in Supabase database
- ✅ File-based route protection with Expo Router
- ✅ Real-time auth state monitoring
- ✅ Automatic navigation on auth state changes
- ❌ No Spotify OAuth (planned)
- ❌ No Apple MusicKit authentication (planned)
- ❌ No music service token storage (planned)
- ❌ No global state management (Zustand/Context not set up)

**Platform Limitations:**
- Apple Sign-In only available on iOS devices
- `isAvailableAsync()` check prevents button display on unsupported platforms

---

## Planned Extensions

Per `AGENTS.md`, the following are planned:

1. **Spotify OAuth** — OAuth 2.0 flow for Spotify account linking
2. **Apple MusicKit Authentication** — MusicKit JS integration for Apple Music
3. **State Management** — Zustand or React Context for global auth state
4. **Music Service Token Storage** — Secure storage of access/refresh tokens for music services

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

**Current:** Session-based auth state via Supabase

**Implemented:**
- ✅ Supabase session automatically persisted across app restarts
- ✅ Auth state changes trigger automatic navigation updates
- ✅ Protected routes implemented via Expo Router layouts
- ✅ Real-time auth state monitoring with subscriptions

**Future Enhancement:**
- Add Zustand store or React Context for global app state (user preferences, etc.)
- Track additional state: `currentUser`, `linkedServices` (music services)
- Cache user profile data to reduce Supabase queries

### Backend Integration (Supabase)

**Current:** Supabase fully integrated ✅

**Implemented:**
1. ✅ Supabase client configured in `src/lib/supabase.ts`
2. ✅ Supabase Auth integrated with Apple Sign-In
3. ✅ User profiles stored in Supabase `profiles` table
4. ✅ Session persistence via Supabase AsyncStorage adapter
5. ✅ Real-time auth state synchronization

**Configuration:**
- Supabase URL and anon key managed via `app.config.ts`
- AsyncStorage used for session persistence
- Row-level security (RLS) policies protect user data

**Next Steps:**
- Add `linkedServices` field to profiles table for music service tokens
- Implement Supabase Edge Functions for music API integrations
- Add real-time subscriptions for activity feed

---

## Critical Notes

1. **Error Handling:** Always handle `ERR_CANCELED` silently (user-initiated cancellation)
2. **Platform Checks:** Always check availability before showing auth buttons
3. **Privacy:** Only request scopes that are necessary (see `AGENTS.md` line 38-39)
4. **Token Security:** Never log or expose tokens in error messages or console
5. **Session Management:** Supabase automatically handles session refresh and persistence
6. **Route Protection:** Auth guards in root layout prevent unauthorized access to protected routes
7. **Navigation:** Auth state changes trigger automatic navigation — no manual navigation needed

---

## Key Files

**Authentication:**
- `src/app/(auth)/welcome.tsx` — Apple Sign-In implementation
- `src/features/auth/session.ts` — Auth session helpers
- `src/lib/supabase.ts` — Supabase client configuration

**Route Protection:**
- `src/app/_layout.tsx` — Root layout with auth guards
- `src/app/index.tsx` — Entry point with redirect logic
- `src/app/(tabs)/_layout.tsx` — Protected tab layout

**Configuration:**
- `app.config.ts` — Apple Sign-In and Expo configuration
- `.env` — Supabase credentials (not committed)

**Reference:**
- `docs/AGENTS.md` — Architecture and data model reference

---

**Last Updated:** November 2025

