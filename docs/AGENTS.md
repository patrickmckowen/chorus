# AGENTS.md — Chorus App Development Context

## Purpose
This document provides persistent, high-level context for coding agents contributing to the **Chorus** project — a cross-platform social music app that connects users from Spotify and Apple Music. It ensures alignment on technical direction, architecture, and conventions, while allowing flexibility for evolving UX and UI decisions.

---

## Core Concept
Chorus enables users to **see what their friends are listening to** across music services. It aggregates real-time playback data from Spotify and Apple Music, normalizes it, and displays it in an activity feed that can be shared with groups (friends, family, or work circles).

Agents should assume the following:
- The UX and visuals may iterate frequently.
- API integrations, data models, and event flow should be built with **extensibility and modularity** in mind.

---

## Architectural Principles
1. **Cross-Platform First:**
   - Use **React Native (Expo)** on the new architecture for unified development.
   - Keep native-specific logic minimal and well-isolated (e.g., platform conditionals only in service wrappers).
   - Use **Expo Router** for file-based routing — simpler, more maintainable than imperative navigation.

2. **Decoupled Data Layer:**
   - Each music service (Spotify, Apple Music) should have its own data provider with a common interface.
   - The backend normalization layer should abstract differences between APIs.
   - All agents must assume new providers (e.g., YouTube Music) could be added later.

3. **Real-Time Synchronization:**
   - Use **Supabase Realtime** for presence and updates.
   - Prefer **WebSocket or Supabase Realtime subscriptions** for live activity feed sync.

4. **Serverless/Edge-Ready Backend:**
   - The backend should be modular — deployable on Supabase Edge Functions or Node-based microservices.
   - Avoid heavy persistent servers.
   - Shared utils (e.g., data normalization, track metadata mapping) should be portable between client and backend.

5. **Authentication & Linking:**
   - Support both Spotify OAuth and Apple MusicKit authentication.
   - Store only minimal, non-sensitive playback info.
   - Respect user privacy — the user explicitly opts in to share now-playing data.

6. **Scalability:**
   - Architect for small-group sharing first.
   - Keep data fetches and updates efficient — optimize for mobile data and battery.
   - Use pagination and caching in the feed.

---

## Code Organization
**Current Structure:**
- **/src/app/** → Expo Router file-based routes
  - **_layout.tsx** → Root layout with auth protection
  - **index.tsx** → Entry point with redirect logic
  - **(auth)/** → Unauthenticated route group (welcome, sign-in)
  - **(tabs)/** → Protected tab route group (home, profile)
- **/src/features/** → Independent app modules (Auth implemented, Groups/Feed planned)
  - **/auth/** → Authentication helpers and session management
- **/src/lib/** → Utilities and configuration (Supabase client, config)
- **/src/components/** → Shared UI primitives (cards, list items, avatars, buttons)
- **/src/hooks/** → Custom React hooks
- **/src/theme/** → Theming configuration and styles

**Legacy (to be removed):**
- **/src/navigation/** → Old React Navigation setup (deprecated)
- **/src/screens/** → Old screen components (being migrated to /app routes)

**Planned Structure:**
- **/src/services/** → Integrations (Spotify, Apple Music API clients)
- **/functions/** → Supabase Edge Functions or serverless backend functions

---

## Data Model Overview
```ts
User {
  id: string;
  displayName: string;
  avatarUrl?: string;
  linkedServices: {
    spotify?: { accessToken: string; refreshToken: string };
    appleMusic?: { musicUserToken: string };
  };
  groups: string[]; // group IDs
}

TrackActivity {
  id: string;
  userId: string;
  trackName: string;
  artistName: string;
  albumArtUrl: string;
  source: 'spotify' | 'appleMusic';
  timestamp: number;
}

Group {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: number;
}
```

---

## Development Guidelines
- Maintain **TypeScript-first** codebase.
- Use **Zustand or React Context** for state management (no Redux).
- Prefer **functional components** and **React Hooks**.
- Follow **modular commits** and clear PR descriptions for agent traceability.
- Use **ESLint + Prettier** with shared config.

---

## Environment & Dependencies
**Currently Installed:**
- **Expo SDK ~54.0** with new architecture enabled (`newArchEnabled: true`)
- **React 19.1.0** and **React Native 0.81.5**
- **Expo Router ~6.0** for file-based routing and navigation
- **React Native Reanimated v4** for animations
- **TypeScript 5.9** with strict mode
- **ESLint + Prettier** for code quality
- **Supabase v2.80.0** for backend (Auth, Database, Realtime)
- **expo-apple-authentication v8.0.7** for Apple Sign-In
- **@react-native-async-storage/async-storage v2.2.0** for session persistence

**Planned (to be added):**
- **Zustand** or **React Context** for global app state management
- **Apple MusicKit JS** + **Spotify Web API** clients
- **Node.js 20+** for Supabase Edge Functions

---

## Key Commands
```bash
# Start Expo development server
npm run start

# Run on iOS simulator
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code
npm run lint

# Run tests
npm run test

# Deploy Supabase Edge Functions (to be added when functions are set up)
# npm run deploy:functions
```

---

## Principles for Agents
1. **Autonomy with Context:** Agents should act independently but remain within architectural and data flow conventions.
2. **Human-Readable Code:** Prioritize clarity and maintainability over brevity.
3. **Graceful Degradation:** Handle partial data and API failures without crashes.
4. **Extensibility:** Favor configuration-driven patterns (e.g., dynamic providers) over rigid logic.
5. **Minimal UI Coupling:** Logic should be decoupled from visuals — expect design evolution.

---

## Communication with Other Agents
When creating or modifying a module:
- Reference this `AGENTS.md` for context.
- Add module-level `README.md` files where appropriate.
- Document all exposed interfaces, types, and assumptions.

---

## Next Steps for Agents
1. ✅ Initialize the React Native app with Expo and new architecture
2. ✅ Migrate to Expo Router with file-based routing
3. ✅ Set up Supabase project and connection
4. ✅ Implement Apple Sign-In with Supabase Auth
5. ✅ Add session-based route protection
6. ✅ Create Auth feature module in `/src/features/`
7. Create service wrappers for Spotify and Apple Music in `/src/services/`
8. Create Feed and Groups feature modules in `/src/features/`
9. Set up global state management (Zustand or React Context)
10. Prototype real-time activity feed with mock data
11. Add group creation and invite mechanism
12. Implement music service integrations (Spotify OAuth, Apple MusicKit)
13. Add real-time playback tracking and feed updates

---

**Last Updated:** November 2025

This file should remain source-of-truth for all agents contributing to the Chorus app.

