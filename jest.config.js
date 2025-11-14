module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-safe-area-context|react-native-screens|expo|expo-modules-core|@expo|expo-router|react-native-worklets|react-native-worklets-core)/)',
  ],
};
