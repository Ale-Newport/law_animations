// Playwright configuration for the animation library tests.
// The static server binds to loopback only.
import {defineConfig} from '@playwright/test';

const PORT = Number(process.env.LAW_TEST_PORT || 5199);

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.test.js',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 60000,
  reporter: [['list']],
  // Separate output dirs let several test runs execute concurrently.
  outputDir: process.env.PW_OUT || 'production/test-output',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
    viewport: {width: 1280, height: 800},
    deviceScaleFactor: 1,
  },
  webServer: {
    command: `node scripts/serve.mjs --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/tests/harness/host.html`,
    reuseExistingServer: true,
    timeout: 20000,
  },
});
