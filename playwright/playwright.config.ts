// Main Playwright config: tells Playwright where the tests are, how to run them,
// which reports to produce, and which "projects" (groups of tests) exist.
import { defineConfig, devices, ReporterDescription } from '@playwright/test';
import { config } from './src/config/env.config'; // reads URLs, credentials etc. from env/ files
import { Timeouts } from './src/config/timeouts'; // all timeouts kept in one place

// Base folder for all reports (default: "reports")
const R = config.reportDir;

// Reporters = the output formats for test results.
// In CI with sharding (tests split across machines), each machine writes a "blob"
// report; these are merged later using merge.config.ts.
// Locally you get list (terminal) + html + junit (for CI tools) + json.
const reporters: ReporterDescription[] = process.env.BLOB_REPORT
  ? [['blob', { outputDir: `${R}/blob` }], ['list']]
  : [
    ['list'],
    ['html', { outputFolder: `${R}/html`, open: 'never' }],
    ['junit', { outputFile: `${R}/junit/results.xml` }],
    ['json', { outputFile: `${R}/json/results.json` }],
  ];

/**
 * Tag filtering from environment variables (mostly used by CI):
 *   TAGS="@smoke"                 → run only smoke tests
 *   TAGS="@smoke|@critical"       → run tests with either tag
 *   EXCLUDE_TAGS="@negative"      → skip negative tests
 * Locally you can use the CLI instead: npx playwright test --grep @smoke --grep-invert @negative
 */
// Applied per project (not globally) so the auth "setup" project never gets filtered out
const tagFilter = {
  grep: process.env.TAGS ? new RegExp(process.env.TAGS) : undefined,
  grepInvert: process.env.EXCLUDE_TAGS ? new RegExp(process.env.EXCLUDE_TAGS) : undefined,
};

// Shared browser settings: Desktop Chrome + the saved logged-in session (from the setup project)
const browserDefaults = { ...devices['Desktop Chrome'], storageState: config.authFile };

export default defineConfig({
  testDir: './tests', // root folder of all spec files
  outputDir: `${R}/test-results`, // traces, screenshots, videos go here
  fullyParallel: true, // run tests inside a file in parallel too
  forbidOnly: config.isCI, // fail CI if someone left test.only in the code
  retries: config.isCI ? 1 : 0, // retry flaky tests once in CI only
  workers: config.isCI ? 4 : undefined, // parallel workers (undefined = Playwright decides locally)
  timeout: Timeouts.test, // max time for one test
  expect: { timeout: Timeouts.expect }, // max time an expect() keeps retrying
  reporter: reporters,

  // Defaults applied to every test
  use: {
    baseURL: config.uiBaseUrl, // lets you write page.goto('/login') instead of the full URL
    headless: config.headless, // HEADLESS=false in env to see the browser
    actionTimeout: Timeouts.action, // click, fill etc.
    navigationTimeout: Timeouts.navigation, // page.goto, waitForURL
    trace: 'retain-on-failure', // keep the trace only when a test fails
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid', // used by page.getByTestId('...')
  },

  projects: [
    // 1. Setup: logs in once and saves the browser session to .auth/user.json
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/ },

    // 2. API tests: no browser needed and no dependency on setup
    { name: 'api', testDir: './tests/api', ...tagFilter },

    // 3. Browser tests: run after setup and reuse the saved session (no login per test)
    { name: 'ui', testDir: './tests/ui', dependencies: ['setup'], use: browserDefaults, ...tagFilter },
    { name: 'e2e', testDir: './tests/e2e', dependencies: ['setup'], use: browserDefaults, ...tagFilter },

    // Optional Firefox run: CROSS_BROWSER=true npx playwright test --project=ui-firefox
    ...(process.env.CROSS_BROWSER === 'true'
      ? [
        {
          name: 'ui-firefox',
          testDir: './tests/ui',
          dependencies: ['setup'],
          use: { ...devices['Desktop Firefox'], storageState: config.authFile },
          ...tagFilter,
        },
      ]
      : []),

    // Auddia stage (external site): API login once, then reuse the saved session
    ...(process.env.AUDDIA_UI_URL
      ? [
        { name: 'auddia-setup', testDir: './tests/auddia', testMatch: /.*\.setup\.ts/ },
        {
          name: 'auddia',
          testDir: './tests/auddia',
          testIgnore: /.*\.setup\.ts/,
          dependencies: ['auddia-setup'],
          use: {
            ...devices['Desktop Chrome'],
            baseURL: config.auddia.uiBaseUrl,
            storageState: config.auddia.authFile,
          },
        },
      ]
      : []),

  ],
});
