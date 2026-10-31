// EXPO_BASE_URL serves the web build from /book-club on GitHub Pages; unset locally.
const baseUrl = process.env.EXPO_BASE_URL;

module.exports = {
  name: 'The Traveling Books',
  slug: 'book-club',
  scheme: 'book-club',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#f6f1e6' },
  },
  web: { bundler: 'metro', name: 'The Traveling Books', favicon: './assets/favicon.png' },
  plugins: ['expo-asset'],
  ...(baseUrl && { experiments: { baseUrl } }),
};
