import {defineConfig, devices} from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [
        ['github'],
        ['html', {outputFolder: 'e2e/playwright-report', open: 'never'}],
      ]
    : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    video: isCI ? 'on' : 'retain-on-failure',
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'firefox', use: {...devices['Desktop Firefox']}},
    {name: 'webkit', use: {...devices['Desktop Safari']}},
  ],
});