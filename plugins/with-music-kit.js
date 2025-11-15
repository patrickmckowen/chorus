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

