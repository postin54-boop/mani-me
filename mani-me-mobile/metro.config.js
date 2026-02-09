// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Polyfill Node.js built-in modules not available in React Native
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  punycode: require.resolve('punycode'),
};

module.exports = config;