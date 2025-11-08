const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript path aliases
config.resolver = {
	...config.resolver,
	alias: {
		...config.resolver?.alias,
	},
	extraNodeModules: {
		...config.resolver?.extraNodeModules,
	},
};

// Add src directory to watchFolders for better module resolution
config.watchFolders = [path.resolve(__dirname, 'src')];

module.exports = config;

