import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: the production web build, in demo mode (no Supabase,
 * with the dev bar to play every part of a handoff), driven in Chromium at
 * phone size. `npm run test:e2e` builds, serves and runs them.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } }],
  webServer: {
    command:
      'EXPO_NO_DOTENV=1 EXPO_PUBLIC_DEV_MODE=true npx expo export --platform web --output-dir e2e-dist && node e2e/serve.mjs e2e-dist 4173',
    url: 'http://localhost:4173',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
