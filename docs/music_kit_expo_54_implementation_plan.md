# Native MusicKit Integration Plan for Expo SDK 54 (Chorus)

This plan replaces the previous implementation with a **compilable, minimal, native-first** MusicKit integration that is aligned with `AGENTS.md` and correct for Expo SDK 54.

---
## 0. Objectives (What We’re Actually Doing)

1. Use **native MusicKit (Swift)** to:
   - Request Apple Music authorization.
   - Retrieve the **Music User Token**.
2. Keep the surface area **tiny** for now:
   - `requestAuthorization(): Promise<AuthorizationStatusString>`
   - `getUserToken(): Promise<string>`
3. Use that token to call:
   - `GET https://api.music.apple.com/v1/me/recent/played/tracks`
4. Capture raw JSON as fixtures and feed it into debug UI, so we can design screens using **real data**.

---
## 1. Prerequisites & Assumptions

- Project uses **Expo SDK 54** with **new architecture** and a **custom dev client**.
- App is **iOS-only** for now.
- Minimum iOS version will be **15.0+** (required for Swift MusicKit framework).
- You already have:
  - A working **Apple Music Developer Token** generator available in JS as `getAppleDeveloperTokenOrThrow()`.
  - A debug screen (e.g. `/debug/music-auth`) that can display a list of payloads.

### 1.1. Set iOS Deployment Target to 15.0

In `app.json` or `app.config.*`:

```jsonc
{
  "expo": {
    "ios": {
      "deploymentTarget": "15.0"
    }
  }
}
```

This avoids availability issues when importing and using the `MusicKit` framework.

---
## 2. Apple Developer Portal Setup (One-Time)

You **must** configure the App ID correctly in the Apple Developer portal; the config plugin does *not* do this for you.

1. Go to **Apple Developer → Certificates, Identifiers & Profiles**.
2. Find your **App ID** (matching the Expo bundle identifier, e.g. `com.yourcompany.chorus`).
3. Edit the App ID capabilities:
   - Enable **MusicKit**.
4. Regenerate / download the provisioning profiles as needed and make sure Xcode/Expo are using them.

If MusicKit is not enabled here, you’ll get entitlement/provisioning errors even if the plugin is correct.

---
## 3. Expo iOS InfoPlist & Plugin Wiring

### 3.1. Add NSAppleMusicUsageDescription

Apple **requires** an Info.plist usage description for Music access.

In `app.json` / `app.config.*`:

```jsonc
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppleMusicUsageDescription": "Chorus uses Apple Music to read your listening history so we can show your music profile."
      }
    }
  }
}
```

### 3.2. Add the MusicKit Config Plugin

Add a new file at `plugins/with-music-kit.js`:

```js
const { withEntitlementsPlist, withXcodeProject } = require("expo/config-plugins");

function withMusicKit(config) {
  // 1. Add MusicKit entitlement (must also be enabled in Apple Dev Portal)
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.music-user-token"] = true;
    return config;
  });

  // 2. Link the system MusicKit framework
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const framework = "MusicKit.framework";
    const frameworkPath = `System/Library/Frameworks/${framework}`;

    project.addFramework(frameworkPath, {
      customFramework: false,
      embed: false,
    });

    return config;
  });

  return config;
}

module.exports = withMusicKit;
```

Wire the plugin in `app.json` / `app.config.*`:

```jsonc
{
  "expo": {
    "plugins": [
      "./plugins/with-music-kit"
    ]
  }
}
```

---
## 4. Native Expo Module (Swift + MusicKit)

Create `ios/chorus/AppleMusicAuthModule.swift` (folder name can match your module naming convention, but `chorus` is fine).

### 4.1. Swift Exceptions

We’ll define explicit exceptions for clearer JS errors.

```swift
import ExpoModulesCore
import MusicKit

final class DeveloperTokenEmptyException: GenericException<Void> {
  override var reason: String {
    "Developer token is empty."
  }
}

final class MusicKitNotAvailableException: GenericException<Void> {
  override var reason: String {
    "MusicKit is not available on this device or iOS version. iOS 15+ and a real device are required."
  }
}
```

### 4.2. Module Definition

```swift
public class AppleMusicAuthModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleMusicAuth")

    // Request Apple Music authorization and return a status string
    AsyncFunction("requestAuthorization") { () async throws -> String in
      // Guard iOS version
      guard #available(iOS 15.0, *) else {
        throw MusicKitNotAvailableException(())
      }

      let status = await MusicAuthorization.request()
      return status.toString
    }

    // Get Music User Token using a valid developer token
    AsyncFunction("getUserToken") { (developerToken: String) async throws -> String in
      // Guard iOS version
      guard #available(iOS 15.0, *) else {
        throw MusicKitNotAvailableException(())
      }

      let trimmed = developerToken.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmed.isEmpty else {
        throw DeveloperTokenEmptyException(())
      }

      // MusicKit user token retrieval
      let token = try await MusicUserTokenProvider.userToken(for: trimmed)
      return token
    }
  }
}

private extension MusicAuthorization.Status {
  var toString: String {
    switch self {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "notDetermined"
    @unknown default: return "unknown"
    }
  }
}
```

Notes:
- `AsyncFunction` closures are explicitly `async` and `async throws` so we can use `await` and `try await` inside.
- We guard with `#available(iOS 15.0, *)` for safety, even though we set the deployment target to 15.0.
- The exception types give predictable error messages in JS.

---
## 5. TypeScript Service Layer

Create `src/services/music/appleMusic.ts` (or update if it already exists) to keep the public API tiny and JS-owned.

```ts
import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";
import { getAppleDeveloperTokenOrThrow } from "../config";

// Native module name must match `Name("AppleMusicAuth")` in Swift
const AppleMusicAuth = requireNativeModule("AppleMusicAuth");

export type AppleMusicAuthorizationStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "unknown";

export async function requestAppleMusicAuthorization(): Promise<AppleMusicAuthorizationStatus> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Music authorization is only supported on iOS.");
  }

  const status: AppleMusicAuthorizationStatus = await AppleMusicAuth.requestAuthorization();
  return status;
}

export async function getAppleMusicUserToken(): Promise<string> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Music user token is only supported on iOS.");
  }

  const developerToken = getAppleDeveloperTokenOrThrow();
  const musicUserToken: string = await AppleMusicAuth.getUserToken(developerToken);
  return musicUserToken;
}
```

This keeps JS responsible for:
- Supplying the **developer token**.
- Handling platform checks.

Native is responsible for:
- Talking to **MusicKit** and returning a token or throwing a clear error.

---
## 6. Debug Flow: Real Data Fixtures

Update your `runAppleMusicDebugFlow()` (wherever you keep debug flows) to:

1. Request authorization.
2. Get Music User Token.
3. Fetch `recent/played/tracks`.
4. Return a structured array of payloads for the debug UI.

Example:

```ts
import {
  requestAppleMusicAuthorization,
  getAppleMusicUserToken,
} from "@/services/music/appleMusic";
import { getAppleDeveloperTokenOrThrow } from "@/services/config";

export async function runAppleMusicDebugFlow() {
  const payloads: any[] = [];

  // 1. Authorization status
  const status = await requestAppleMusicAuthorization();
  payloads.push({
    label: "Apple Music Authorization",
    data: { status },
    fixturePath: "docs/fixtures/appleMusic/authorize.json",
  });

  // 2. Music User Token
  const musicUserToken = await getAppleMusicUserToken();
  payloads.push({
    label: "Apple Music: Music User Token (preview)",
    data: {
      preview: musicUserToken.slice(0, 6) + "..." + musicUserToken.slice(-4),
      length: musicUserToken.length,
    },
    fixturePath: "docs/fixtures/appleMusic/user-token.json",
  });

  // 3. Recently played tracks
  const developerToken = getAppleDeveloperTokenOrThrow();

  const recent = await fetch(
    "https://api.music.apple.com/v1/me/recent/played/tracks",
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": musicUserToken,
      },
    }
  ).then((r) => r.json());

  payloads.push({
    label: "Apple Music: Recent Played Tracks",
    data: recent,
    fixturePath: "docs/fixtures/appleMusic/recent-played.json",
  });

  return payloads;
}
```

This is enough to:
- Verify auth works.
- Verify the Music User Token looks plausible.
- Feed real listening data into fixtures to design UI components.

---
## 7. Build & Run Instructions

Because we added native code + a config plugin, we must build a **custom dev client**.

1. Run prebuild to apply plugins and generate Xcode project:

   ```bash
   npx expo prebuild
   ```

2. Build and run on **a real iOS device** (MusicKit is not reliable on simulator):

   ```bash
   npm run ios
   # or
   npx expo run:ios
   ```

3. On the device:
   - Open the debug screen (e.g. `/debug/music-auth`).
   - Trigger `runAppleMusicDebugFlow()`.
   - Confirm payloads show:
     - Authorization status.
     - Token preview and length.
     - Recent played tracks JSON.

4. Capture the JSON payloads into the fixture paths referenced above so you can:
   - Build UI components off static fixture data.
   - Iterate on design without hitting Apple’s API every time.

---
## 8. What This Unlocks (Per AGENTS.md)

Once this plan is implemented and verified, you can:

- Treat Apple Music listening history as **real, local sample data** in the app.
- Build and iterate on:
  - Profile views showing recent listening.
  - Timeline/history views.
  - Simple charts and groupings.
- Do all of that **without** building final auth flows or persistent state management yet; the debug flow + fixtures are sufficient for Phase 1.

This keeps the surface area small, matches the iOS-only native strategy, and directly supports “design with real data” from `AGENTS.md`.

