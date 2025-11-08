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

2. **Decoupled Data Layer:**
   - Each music service (Spotify, Apple Music) should have its own data provider with a common interface.
   - The backend normalization layer should abstract differences between APIs.
   - All agents must assume new providers (e.g., YouTube Music) could be added later.

3. **Real-Time Synchronization:**
   - Use **Firebase Realtime Database** or **Firestore** for presence and updates.
   - Prefer **WebSocket or Firebase onSnapshot** for live activity feed sync.

4. **Serverless/Edge-Ready Backend:**
   - The backend should be modular — deployable on Firebase Functions or Node-based microservices.
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
- **/src/navigation/** → Navigation setup and routing configuration.
- **/src/screens/** → Screen components (e.g., HomeScreen).
- **/src/components/** → Shared UI primitives (cards, list items, avatars, buttons).
- **/src/lib/** → Utilities and configuration helpers.
- **/src/hooks/** → Custom React hooks.
- **/src/theme/** → Theming configuration and styles.

**Planned Structure (to be implemented):**
- **/src/services/** → Integrations (Spotify, Apple Music, backend API clients).
- **/src/features/** → Independent app modules (Feed, Groups, Profile, Auth).
- **/functions/** → Firebase or serverless backend functions.

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
- **Expo SDK ~54.0** with new architecture enabled (`newArchEnabled: true`).
- **React 19.1.0** and **React Native 0.81.5**.
- **React Navigation v7** for screen management.
- **React Native Reanimated v4** for animations.
- **TypeScript 5.9** with strict mode.
- **ESLint + Prettier** for code quality.

**Planned (to be added):**
- **Firebase** for backend integration (Realtime Database or Firestore).
- **Zustand** or **React Context** for state management.
- **Apple MusicKit JS** + **Spotify Web API** clients.
- **Node.js 20+** for serverless functions.

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

# Deploy Firebase functions (to be added when functions are set up)
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
1. ✅ Initialize the React Native app with Expo and new architecture (completed).
2. Set up Firebase project and connection.
3. Create service wrappers for Spotify and Apple Music in `/src/services/`.
4. Create feature modules (Feed, Groups, Profile, Auth) in `/src/features/`.
5. Set up state management (Zustand or React Context).
6. Prototype real-time feed with mock data.
7. Add auth flows and group invite mechanism.
8. Implement persistence and caching strategies.

---

**Last Updated:** November 2025

This file should remain source-of-truth for all agents contributing to the Chorus app.

