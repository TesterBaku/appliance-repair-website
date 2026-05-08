// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: ['**/*.spec.js'],
  fullyParallel: true,
  timeout: 10000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8788',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'node test/serve.js',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
