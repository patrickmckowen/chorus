/* eslint-disable @typescript-eslint/no-require-imports */
const { withEntitlementsPlist, withXcodeProject } = require("expo/config-plugins");

function withMusicKit(config) {
  // 1. Add MusicKit entitlement (must also be enabled in Apple Dev Portal)
  config = withEntitlementsPlist(config, (entitlementsConfig) => {
    entitlementsConfig.modResults["com.apple.developer.music-user-token"] = true;
    return entitlementsConfig;
  });

  // 2. Link the system MusicKit framework
  config = withXcodeProject(config, (xcodeConfig) => {
    const project = xcodeConfig.modResults;
    const framework = "MusicKit.framework";
    const frameworkPath = `System/Library/Frameworks/${framework}`;

    project.addFramework(frameworkPath, {
      customFramework: false,
      embed: false,
    });

    return xcodeConfig;
  });

  return config;
}

module.exports = withMusicKit;

