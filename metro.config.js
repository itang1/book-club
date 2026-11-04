// Default Expo config, plus .woff2 so the web fonts in assets/fonts bundle as files.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('woff2');

module.exports = config;
