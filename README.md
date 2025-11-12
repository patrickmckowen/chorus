# chorus
Real-time music feed that lets you see what your friends are listening to on Spotify and Apple Music.

## Development

### Getting Started

Start the Expo development server:
```bash
npm start
```

This will start the Metro bundler and display a QR code in the terminal. You can then:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with Expo Go app on your device

### iOS Build & Testing

#### Testing in iOS Simulator

**Option 1: Using Expo CLI (Recommended for development)**
```bash
npm run ios
```

This command will:
- Start the Expo development server
- Build and launch the app in the iOS simulator
- Automatically open the default simulator

**Option 2: Manual Simulator Selection**
```bash
# List available simulators
xcrun simctl list devices available

# Run on a specific simulator
npm run ios -- --simulator="iPhone 15 Pro"
```

#### Testing on Physical iPhone Device

**Prerequisites:**
1. Connect your iPhone to your Mac via USB
2. Trust the computer on your iPhone if prompted
3. Ensure your Mac and iPhone are on the same Wi-Fi network
4. Install the Expo Go app from the App Store on your iPhone

**Option 1: Using Expo Go (Development)**
```bash
# Start the development server
npm start

# Then scan the QR code displayed in the terminal with:
# - Camera app (iOS 11+)
# - Expo Go app
```

**Option 2: Development Build on Device**
```bash
# Build and install development client on connected device
npx expo run:ios --device
npx expo start

# Or specify device by name
npm run ios -- --device="Patrick's iPhone"
```

**Note:** For development builds, you may need to:
- Configure code signing in Xcode
- Register your device in Apple Developer Portal (for non-simulator builds)
- Trust the developer certificate on your device (Settings > General > VPN & Device Management)

### Troubleshooting

#### Restart Expo Development Server

If you encounter issues with the development server:

```bash
# Stop the current server (Ctrl+C), then restart
npm start

# Or force restart with cache clearing
npm start -- --clear
```

#### Clear Cache

When experiencing build issues, stale cache, or unexpected behavior:

**Clear Metro bundler cache:**
```bash
npm start -- --clear
```

**Clear Expo cache:**
```bash
npx expo start --clear
```

**Clear all caches (nuclear option):**
```bash
# Clear Metro bundler cache
npm start -- --clear

# Clear watchman cache (if installed)
watchman watch-del-all

# Clear iOS build cache
cd ios && rm -rf build && cd ..

# Clear node modules and reinstall (if needed)
rm -rf node_modules
npm install
```

#### Reset iOS Simulator

If the simulator is behaving unexpectedly:

```bash
# Reset all simulators (WARNING: This deletes all simulator data)
xcrun simctl erase all

# Or reset a specific simulator
xcrun simctl erase "iPhone 15 Pro"
```

#### Rebuild iOS App

For native code changes or persistent build issues:

```bash
# Clean and rebuild
cd ios
pod install
cd ..
npm run ios

# Or with cache clearing
npm run ios -- --clear
```

### Common Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Lint code
npm run lint

# Run tests
npm run test
```

## Project Structure

- `/src/navigation/` → Navigation setup and routing
- `/src/screens/` → Screen components
- `/src/components/` → Shared UI components
- `/src/lib/` → Utilities and configuration
- `/src/hooks/` → Custom React hooks
- `/src/theme/` → Theming configuration

For more architectural details, see [AGENTS.md](./AGENTS.md).
