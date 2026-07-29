// @ts-check
const { defineConfig } = require('@playwright/test');

// Port is overridable so the suite can dodge a busy 8788 without editing this file:
//   PORT=8799 npm run test:functional
// test/serve.js reads the same env var, so both sides stay in sync. Default stays 8788.
//
// Why this matters: reuseExistingServer is true locally, so if ANY unrelated process
// already holds this port (a sibling project's `wrangler dev`, a stale test/serve.js),
// Playwright silently reuses that foreign server and every page test fails against the
// wrong site, with timeouts that look like real regressions. Overriding PORT is the
// fast way out; the failure mode is documented here so the next person recognizes it.
// Validate rather than silently defaulting: `Number(process.env.PORT) || 8788` turns a typo
// like PORT=foo into 8788, which recreates the exact busy-port failure this override exists to
// avoid, while looking like the override was applied. Fail loudly instead.
function resolvePort(raw) {
  if (raw === undefined || raw === '') return 8788;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid PORT "${raw}": expected an integer between 1 and 65535 (omit PORT to use the default 8788).`);
  }
  return n;
}

const PORT = resolvePort(process.env.PORT);
const ORIGIN = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: './test',
  testMatch: ['**/*.spec.js'],
  fullyParallel: true,
  timeout: 10000,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list']],
  use: {
    baseURL: ORIGIN,
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'node test/serve.js',
    url: ORIGIN,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
