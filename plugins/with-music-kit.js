const { withEntitlementsPlist, withXcodeProject } = require("expo/config-plugins");

function withMusicKit(config) {
  // NOTE: MusicKit entitlement is commented out to allow builds before Apple Developer Portal setup.
  // To enable MusicKit:
  // 1. Enable MusicKit in Apple Developer Portal for your App ID
  // 2. Regenerate/download provisioning profiles
  // 3. Uncomment the entitlement code below and run `npx expo prebuild --clean`

  // Only add MusicKit entitlement if explicitly enabled in config
  // This allows builds to succeed before MusicKit is enabled in Apple Developer Portal
  const enableMusicKit = config.ios?.enableMusicKit ?? false;

  if (enableMusicKit) {
    // Add MusicKit entitlement (must also be enabled in Apple Dev Portal)
    config = withEntitlementsPlist(config, (config) => {
      config.modResults["com.apple.developer.music-user-token"] = true;
      return config;
    });
  }

  // Link the system MusicKit framework
  // This allows the code to compile. The entitlement must be enabled for runtime.
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

