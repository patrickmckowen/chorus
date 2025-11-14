# AGENTS.md — Chorus App Development Guide

## 0. Purpose of this Document

This file gives agents enough context to **build the foundations of Chorus** without guessing the final UX.

Right now, our focus is **designing with real data** — not shipping final features.

This means:

- Get **real listening history** from Spotify and Apple Music into our system.
- Expose that data in simple screens (Profile, Home, Playground).
- Use those screens to explore and decide the actual UX later.

Only work on things explicitly described here.

---

## 1. App Goal (User Experience POV)

Chorus is a **social music app**.

From the user’s perspective, the eventual goal is:

> “I connect my Spotify and/or Apple Music once, keep listening in my normal apps, and Chorus shows my listening history in a way that makes it easy to explore my own habits and (later) see what friends are listening to.”

For **this phase**, the UX goal is narrower:

- When I open Chorus:
  - I can **sync** my latest listening from Spotify and/or Apple Music.
  - I can **see my own listening history** as a simple list on my **Profile**.
  - I can **see a basic feed** of listening events on a **Home** screen (initially just me, then optionally multiple test users).
- The UI can be simple and text-based. The important part is:
  - It’s **real data**.
  - It’s easy to iterate on layout and components.

We are not defining the final visual design yet.  
We are building a **playground** to explore it with live data.

---

## 2. High-Level Technical Approach

### 2.1 Platform & Stack

- **Platform:** iOS only.
- **App:** React Native with **Expo** (new architecture).
- **Navigation:** **Expo Router**.
- **Backend:** **Supabase** (Auth, Postgres, simple REST/RPC).
- **Storage:** Supabase Postgres + client-side AsyncStorage where needed.

### 2.2 Data Strategy: Design With Data

We want to **capture real listening events** as simply as possible and use them to prototype UI.

Key idea:  
**One append-only event log, no analytics yet.**

#### Core Table: `TrackActivity`

```ts
TrackActivity {
  id: string;               // uuid
  userId: string;           // Chorus user id
  service: 'spotify' | 'appleMusic';
  serviceTrackId: string;   // raw ID from Spotify/Apple Music
  playedAt: number | null;  // ms epoch; Spotify = real time, Apple = null
  insertedAt: number;       // when Chorus stored the event
}
```

- One row per listening event.
- Do not collapse repeat plays.

**playedAt**:

- Spotify: use the timestamp from /recently-played.
- Apple Music: we do not try to fake a timestamp; keep null for now.

All future UX (feed design, popularity, group views, etc.) will be built on top of this table, not baked into it.

### 2.3 Sync Model (For This Phase)

- We are not building server-side scheduling or background jobs yet.

- For now, sync is:
  - Client-triggered:
    - On app open
    - On “Sync Now” actions

- Flow:
  1. User authenticates with Spotify and/or Apple Music.
  2. User taps “Sync” (or app opens and triggers a fetch).
  3. App:
     - Calls provider APIs for recently played.
     - Normalizes responses to TrackActivity[].
     - Writes new events to Supabase.
  4. Screens (Profile, Home, Playground) read from Supabase and render.

Later, we can add server-side cron/background sync, but it’s out of scope for this phase.

## 3. Technical Constraints to Design For

### iOS-Only, Native Feel

Code is React Native / Expo, but interactions and performance should feel native on iOS.

### Spotify API Constraints

Only last ~50 recently played tracks are available.

Must use OAuth with refresh tokens.

We should fetch regularly when the user opens the app to avoid losing history, but do not over-engineer this yet.

### Apple Music API Constraints

/v1/me/recent/played/tracks returns ordered items but no timestamps.

Requires a developer token + a Music User Token.

User tokens expire after some time; re-auth UX will be needed later (not now).

### No Background Abuse

Do not rely on background audio or unsupported hacks.

Background tasks and cron scheduling are future work, not current.

### Cost & Complexity

Prefer client-triggered sync and simple Supabase usage.

No complex jobs, no aggregates, no analytics tables yet.

### Privacy

User must explicitly link Spotify/Apple.

We store only what’s needed for listening history UX.

## 4. Big Unknown UX Questions (To Answer During Design Phase)

These are open questions that should guide how we prototype UI using real data:

- **How should a person’s listening history be structured?**
  - Flat list?
  - Grouped by day?
  - Grouped by “sessions” of listening?

- **How do we represent time with mixed data?**
  - Spotify has exact timestamps; Apple doesn’t.
  - What’s an honest, understandable way to show this in one UI?

- **What does a compelling “Profile” look like when it’s just history?**
  - Is a simple chronological list enough?
  - Does grouping (by day, by mood, by source) matter?

- **What shape should the Home screen have?**
  - Is it just “my own feed” at first?
  - How does it change when we add other users later?

- **How dense or sparse should the feed be?**
  - Do we show every single play?
  - Do we need grouping or collapsing in the UI to make it readable?

- **What are the most useful UI components for future social features?**
  - Track rows?
  - Session blocks?
  - Day dividers?
  - Minimal “avatar + track” summaries?

The Playground and simple Profile/Home will exist to explore these questions using real TrackActivity data.

## 5. High-Level To-Do List (Sequenced, Small Chunks)

This is the work agents should follow, in order.

Phase 1 — Get Real Data into the App

- [x] Spotify Auth & Local Fetch
  - [x] Implement Spotify OAuth.
  - [x] Call /v1/me/player/recently-played.
  - [x] Show raw JSON on a debug screen.

- [ ] Apple Music Auth & Local Fetch (iOS)
  - [ ] Implement MusicKit auth and get Music User Token.
  - [ ] Call /v1/me/recent/played/tracks.
  - [ ] Show raw JSON on a debug screen.

- [ ] Normalization Layer
  - [ ] Add small mapping functions:
    - [ ] normalizeSpotifyRecentlyPlayed → TrackActivity[]
    - [ ] normalizeAppleRecentlyPlayed → TrackActivity[]
  - [ ] Add a debug screen that lists merged TrackActivity entries in plain text.

- [ ] Local Diffing (Client)
  - [ ] Cache “last seen” per service (in memory or AsyncStorage).
  - [ ] On fetch:
    - [ ] Filter out events already seen.
    - [ ] Keep truly new events, including repeat plays.
  - [ ] Show “New since last sync” list in a debug screen.

Phase 2 — Store Data in Supabase

- [ ] TrackActivity Table & Writes
  - [ ] Create TrackActivity in Supabase with the fields defined above.
  - [ ] From the app, after each fetch, insert new TrackActivity rows for the current user.

- [ ] “My Activity (from DB)” screen
  - [ ] Query recent rows for the logged-in user.
  - [ ] Render as plain text list.

Phase 3 — Design-With-Data Screens

- [ ] Profile Screen v0 (Real Data, Simple UI)
  - [ ] Create /profile screen.
  - [ ] Query TrackActivity for the current user.
  - [ ] Render a chronological (or day-grouped) list of events:
    - [ ] service label
    - [ ] track info (track name, artist if available)
    - [ ] time or placeholder for Apple Music.

- [ ] Home Screen v0 (Self Feed)
  - [ ] Create /home screen.
  - [ ] For now, use the same data as Profile, but treat it as a “feed”:
    - [ ] Slightly different copy/layout is okay.
    - [ ] If trivial, allow an experiment where Home eventually uses multiple test users (hardcoded ids) to simulate a multi-user feed.

- [ ] Sync Now Action
  - [ ] On Profile, Home, and/or a global place, add a “Sync Now” button.
  - [ ] Behavior:
    - [ ] Run provider fetch → normalize → insert to DB.
    - [ ] Refresh the screen data.
  - [ ] This creates a tight loop to test UI with fresh listens.

- [ ] Playground Screen
  - [ ] Add a /playground route (dev only).
  - [ ] It should:
    - [ ] Load TrackActivity for one or more users.
    - [ ] Render multiple experimental layouts/component variants on the same data.
  - [ ] Goal: fast iteration on how to visually represent listening history.

## 6. What Agents Should NOT Do (For Now)

Do not implement:

Popularity, trending, or “3 friends listened”.

Aggregated tables or analytics views.

Server-side scheduled sync (cron jobs).

Background fetch/silent push logic.

Complex social/graph features (groups, invites, etc.).

Do not try to:

Infer or fake timestamps for Apple Music plays.

Collapse multiple plays of the same track into one entry in the database.