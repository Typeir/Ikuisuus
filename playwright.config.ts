/**
 * Playwright Test Configuration
 *
 * @fileoverview Configuration for end-to-end, visual regression, and character builder tests.
 *
 * @module playwright.config
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

import { defineConfig, devices } from '@playwright/test';

/** Builder specs run on chromium only; other projects skip them. */
const BUILDER_SPECS = '**/e2e/builder/**/*.spec.ts';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/e2e/**/*.spec.ts', '**/visual/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: BUILDER_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: BUILDER_SPECS,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: BUILDER_SPECS,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'builder',
      testMatch: BUILDER_SPECS,
      fullyParallel: false,
      timeout: 180_000,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      IK_DEV_BUILDER: '1',
      NEXT_PUBLIC_IK_DEV_BUILDER: '1',
    },
  },
});
