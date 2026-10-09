/**
 * Extends app.json with settings that depend on where the app is built.
 *
 * EXPO_BASE_URL serves the web build from a subpath: GitHub Pages hosts this
 * repo at /book-club, so the deploy workflow sets it. Unset locally, so the
 * dev server stays at /.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
