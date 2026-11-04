// Expo's recommended rules (React, hooks, imports), flat config.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Apostrophes in <Text> are plain text in React Native, not HTML.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Node scripts and config files.
    files: ['scripts/**/*.js', '*.config.js', 'e2e/**/*.mjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      'dist/*',
      'e2e-dist/*',
      'playwright-report/*',
      'test-results/*',
      '.expo/*',
      'supabase/functions/*',
      'design/*',
    ],
  },
]);
