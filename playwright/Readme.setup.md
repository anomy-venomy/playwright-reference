# Playwright Framework – Setup From Scratch

Step-by-step guide to build this framework structure in **any** project.
Follow the steps in order; every file's full content is included, so nothing has to be copied from elsewhere.

**Prerequisites:** Node.js 20+ (`node -v`), npm, VS Code (recommended).

**What you get at the end**

```
playwright/
├── env/                    # .env files (URLs, credentials) – loaded by dotenv
├── src/
│   ├── config/             # env.config.ts, tags.ts, timeouts.ts
│   ├── core/
│   │   ├── api/            # ApiClient, ApiResponseWrapper
│   │   ├── ui/             # BasePage, BaseComponent
│   │   ├── utils/          # logger, @step decorator, cleanup, schema validator
│   │   └── assertions/     # custom expect() matchers for API responses
│   ├── api/                # services/, models/, schemas/ (per app)
│   ├── pages/              # page objects (per app) + components/
│   ├── fixtures/           # Playwright fixtures (test = baseTest + your layers)
│   └── data/               # test data, files to upload
├── tests/                  # api/, ui/, e2e/, setup/
├── playwright.config.ts
└── tsconfig.json, eslint.config.mjs, .prettierrc …
```

---

## Step 1 – Create the folder and start a project

```bash
cd <your-project-root>          # e.g. the repo that holds the app
mkdir playwright && cd playwright
npm init -y                     # creates package.json
```

---

## Step 2 – Install the dev dependencies (pinned versions)

```bash
npm install -D @playwright/test@1.63.0 typescript@5.6.3 @types/node@22.9.0 \
  dotenv@16.4.5 @faker-js/faker@9.2.0 ajv@8.17.1 \
  eslint@9.14.0 @eslint/js@9.14.0 typescript-eslint@8.13.0 \
  eslint-plugin-playwright@2.0.1 prettier@3.3.3

npx playwright install          # downloads the browsers
# Linux/CI only, if browsers fail to start: npx playwright install --with-deps
```

| Package | Why |
|---|---|
| `@playwright/test` | test runner + browsers + API testing |
| `typescript`, `@types/node` | type checking (`npm run typecheck`) |
| `dotenv` | loads `env/*.env` files into `process.env` |
| `@faker-js/faker` | random test data (names, emails…) |
| `ajv` | JSON-schema validation of API responses |
| `eslint` + plugins, `prettier` | linting and formatting |

---

## Step 3 – Create the folder structure and empty files

```bash
# Folders
mkdir -p env .vscode \
  src/{config,core/{api,ui,utils,assertions},api/{services,models,schemas},pages/components,fixtures,data} \
  tests/{api,ui,e2e,setup}

# Root config files (filled in Step 4)
touch playwright.config.ts tsconfig.json eslint.config.mjs merge.config.ts \
      .prettierrc .prettierignore .gitignore .nvmrc \
      .vscode/settings.json .vscode/extensions.json \
      env/.env.local.example

# Reusable framework code (filled in Step 6)
touch src/config/{env.config.ts,tags.ts,timeouts.ts} \
      src/core/api/{ApiClient.ts,ApiResponseWrapper.ts} \
      src/core/assertions/api.matchers.ts \
      src/core/ui/{BasePage.ts,BaseComponent.ts} \
      src/core/utils/{logger.ts,step.decorator.ts,CleanupManager.ts,schemaValidator.ts,jsonPath.ts} \
      src/fixtures/{base.fixture.ts,index.ts}
```

---

## Step 4 – Root config files

### 4.1 `playwright.config.ts`

```ts
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
  ],
});
```

> Until you write `tests/setup/auth.setup.ts`, the `ui`/`e2e` projects have no session to load – start with API tests, or remove `dependencies`/`storageState` for now.

### 4.2 `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",            // modern JS output (Node 20 supports it); also enables the @step decorator
    "module": "node16",            // Node's module system; package.json "type": "commonjs" keeps output CommonJS
    "moduleResolution": "node16",  // resolve imports the way Node does
    "types": ["node"],             // load Node.js types (process, path, __dirname)
    "strict": true,                // strict type checking (catches more bugs)
    "noUnusedLocals": true,        // error on unused variables
    "noImplicitReturns": true,     // every code path in a function must return
    "esModuleInterop": true,       // allows: import dotenv from 'dotenv'
    "resolveJsonModule": true,     // allows: import users from './users.json'
    "skipLibCheck": true,          // don't type-check node_modules (faster)
    // Import shortcuts: import { LoginPage } from '@pages/LoginPage'
    // instead of '../../src/pages/LoginPage'
    // No "baseUrl" needed: paths starting with ./ are relative to this tsconfig.json file
    "paths": {
      "@config/*": ["./src/config/*"],
      "@core/*": ["./src/core/*"],
      "@api/*": ["./src/api/*"],
      "@pages/*": ["./src/pages/*"],
      "@fixtures/*": ["./src/fixtures/*"],
      "@data/*": ["./src/data/*"]
    }
  },
  // Files TypeScript should check
  "include": ["src/**/*.ts", "tests/**/*.ts", "*.config.ts", "*.config.mjs"]
}
```

> Playwright reads these `paths` itself, so the `@config/...` imports work in tests with no extra tooling.

### 4.3 `eslint.config.mjs`

```js
// ESLint (flat config): finds bad patterns in the code.
// Run with: npm run lint   /   npm run lint:fix
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // Folders ESLint should never look at
  { ignores: ['node_modules/', 'reports/', 'test-results/', 'blob-report/', '.auth/'] },

  // Base recommended rules for JavaScript and TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Rules for all our source and test files
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // warn (not error) when using "any"
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // _arg is allowed unused
      // Playwright fixtures with no dependencies are written as `async ({}, use) =>`
      'no-empty-pattern': 'off',
    },
  },

  // Playwright-specific rules, only for test files
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error', // ban page.waitForTimeout() (hard waits = flaky tests)
      'playwright/no-page-pause': 'error', // ban leftover page.pause() debug calls
      'playwright/no-focused-test': 'error', // ban leftover test.only
      'playwright/no-conditional-in-test': 'off', // conditional cleanup registration is allowed
      // Tests must contain an assertion. Helpers listed here also count as assertions.
      // CHANGE THIS LIST to your own page-object helpers (e.g. expectLoaded, expectFieldError)
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectLoaded', 'expectFieldError', 'expectUrlContains', 'expectVisible'] },
      ],
    },
  },

  // Page objects and core code: no hard waits, warn on { force: true } clicks
  {
    files: ['src/core/**/*.ts', 'src/pages/**/*.ts'],
    plugins: { playwright },
    rules: { 'playwright/no-wait-for-timeout': 'error', 'playwright/no-force-option': 'warn' },
  },
);
```

### 4.4 `merge.config.ts`

```ts
/**
 * Used ONLY in CI when tests are split (sharded) across machines.
 * Each machine produces a "blob" report; this combines them into one report:
 *   npx playwright merge-reports --config merge.config.ts <blob-dir>
 * You can ignore this file for local runs.
 */
export default {
  testDir: './tests',
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
};
```

### 4.5 `.prettierrc`

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 110
}
```

### 4.6 `.prettierignore`

```
# Files/folders Prettier should never reformat
node_modules
reports
test-results
blob-report
.auth
package-lock.json
```

### 4.7 `.gitignore`

```
# Installed packages
node_modules/

# Generated test output (reports, traces, screenshots, videos)
reports/
test-results/
blob-report/

# Saved login session from the setup project – contains auth tokens, never commit
.auth/

# Local secrets (your real credentials)
env/.env.local
.env
```

### 4.8 `.nvmrc`

```
20
```

### 4.9 `.vscode/settings.json`

```jsonc
{
  "editor.formatOnSave": true,                         // run Prettier every time you save
  "editor.defaultFormatter": "esbenp.prettier-vscode", // use Prettier as the formatter
  "playwright.reuseBrowser": true,                     // Playwright extension: keep one browser open between runs
  "playwright.showTrace": false                        // don't auto-open the trace viewer after each run
}
```

### 4.10 `.vscode/extensions.json`

```jsonc
{
  // VS Code will suggest installing these when the folder is opened
  "recommendations": [
    "ms-playwright.playwright", // run/debug tests from the editor, pick locators
    "dbaeumer.vscode-eslint",   // show ESLint errors inline
    "esbenp.prettier-vscode"    // Prettier formatter
  ]
}
```

---

## Step 5 – package.json scripts

Replace the `"scripts"` section and add `"engines"` at the end. The result should look like this
(`devDependencies` were filled in by Step 2 – leave them as they are):

```jsonc
{
  "name": "playwright",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "test": "playwright test",                                  // everything
    "test:api": "playwright test --project=api",
    "test:ui": "playwright test --project=ui",
    "test:e2e": "playwright test --project=e2e",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:headed": "playwright test --project=ui --headed",     // watch the browser
    "test:debug": "playwright test --debug",                    // step through with the inspector
    "test:ui-mode": "playwright test --ui",                     // interactive UI mode
    "report": "playwright show-report reports/html",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "quality": "npm run typecheck && npm run lint && npm run format:check"
  },
  "devDependencies": { "...": "from Step 2" },
  "engines": {
    "node": ">=20"
  }
}
```

> JSON does not allow comments – the `//` notes above are only for this guide; don't paste them into package.json.

Extra arguments go after `--`, e.g. `npm run test:ui-mode -- --project=ui login`.

---

## Step 6 – Environment variables with dotenv

All URLs, credentials and switches live in `.env` files – never in code.
`src/config/env.config.ts` loads them with **dotenv** and exposes one typed `config` object.

### 6.1 `env/.env.local.example` (committed – a template, no real secrets)

```bash
# Copy this file to env/.env.local for local runs (git-ignored). Never commit real credentials.

# --- URLs ---
UI_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:4000/api

# --- Test user ---
TEST_USER_EMAIL=your_user@example.com
TEST_USER_PASSWORD=your_password
TEST_USER_NAME=your_username

# --- Run settings (optional – defaults are in env.config.ts) ---
HEADLESS=true
LOG_LEVEL=debug
```

### 6.2 Create your real `env/.env.local`

```bash
cp env/.env.local.example env/.env.local   # then put your real values in it
```

### 6.3 (Optional) one file per environment – `env/.env.<TEST_ENV>`

Non-secret values that differ per environment (URLs) can go in committed files, e.g.
`env/.env.qa`, `env/.env.stage`. Choose one with `TEST_ENV`:

```bash
TEST_ENV=stage npx playwright test     # loads env/.env.stage (default is qa)
```

### 6.4 `src/config/env.config.ts`

```ts
import dotenv from 'dotenv'; // reads KEY=value lines from a file and puts them into process.env
import path from 'path';

/**
 * Where each value comes from – the FIRST one found wins
 * (dotenv never overwrites a variable that is already set):
 *   1. Real environment variables   – CI secrets, or inline: HEADLESS=false npx playwright test
 *   2. env/.env.local               – your machine only, git-ignored, real credentials
 *   3. env/.env.<TEST_ENV>          – shared non-secret values per environment, committed
 */

// Which environment to test: TEST_ENV=stage npx playwright test   (default: qa)
export const TEST_ENV = process.env.TEST_ENV ?? 'qa';

// Load the files. A missing file is fine – dotenv simply skips it.
// process.cwd() is the folder you run `npx playwright test` from (this playwright/ folder).
dotenv.config({ path: path.resolve(process.cwd(), 'env/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), `env/.env.${TEST_ENV}`) });

/**
 * Reads a REQUIRED variable. If it is missing or empty the run stops immediately
 * with a clear message, instead of a confusing failure deep inside a test.
 * `fallback` is used only when the variable is not set at all.
 */
function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing env variable "${name}" for TEST_ENV="${TEST_ENV}"`);
  }
  return value;
}

/**
 * One typed object for the whole framework – import it anywhere:
 *   import { config } from '@config/env.config';
 *   config.uiBaseUrl, config.user.email ...
 *
 * Values are plain properties read straight from process.env (no getters), so they are
 * read ONCE when the config is first imported:
 *   - read('X')                  → required: the run fails at start if X is missing
 *   - process.env.X ?? 'default' → optional: falls back to a default
 */
export const config = {
  env: TEST_ENV,
  isCI: !!process.env.CI, // CI servers (GitHub Actions, Jenkins…) set CI=true

  // --- URLs (required) ---
  uiBaseUrl: read('UI_BASE_URL'), // frontend URL, used as Playwright baseURL
  apiBaseUrl: read('API_BASE_URL'), // backend URL, used by ApiClient

  // --- Test user (required) ---
  user: {
    email: read('TEST_USER_EMAIL'),
    password: read('TEST_USER_PASSWORD'),
    username: read('TEST_USER_NAME'),
  },

  // --- Run settings (optional, with defaults) ---
  headless: (process.env.HEADLESS ?? 'true') !== 'false', // only the string "false" shows the browser
  logLevel: process.env.LOG_LEVEL ?? 'info', // debug | info | warn | error
  reportDir: process.env.REPORT_DIR ?? 'reports',

  // --- Files ---
  authFile: path.resolve(process.cwd(), '.auth/user.json'), // saved login session (setup project)
};
```

**Adding a new variable later** (e.g. an admin user):
1. Add `ADMIN_EMAIL=...` to `env/.env.local.example` (placeholder) and `env/.env.local` (real value).
2. Add it to `config`: `admin: { email: read('ADMIN_EMAIL') }` – or `process.env.ADMIN_EMAIL ?? ''` if it is optional.
3. Use it in tests: `config.admin.email`.
4. In CI, add it as a secret/environment variable (rule 1 above).

> **Required vs optional:** every `read()` value must exist for **every** run, even runs that don't use it.
> If a group of values is only needed by some tests (e.g. a second site), make it optional with
> `process.env.X ?? ''` and only run those tests when the value is set.

---

## Step 7 – Other config files

### `src/config/tags.ts`

```ts
/** Central tag constants – avoids typos like '@smok' silently skipping tests */
export const Tag = {
  smoke: '@smoke',
  regression: '@regression',
  negative: '@negative',
  auth: '@auth',
  // add app-specific tags here, e.g. employees: '@employees'
} as const;
```

Use: `test('logs in', { tag: [Tag.smoke, Tag.auth] }, async () => { ... })`.

### `src/config/timeouts.ts`

```ts
/** Central place for timeouts – never hard-code numbers in pages or steps */
export const Timeouts = {
  test: 90_000, // whole test
  expect: 10_000, // how long expect() keeps retrying
  action: 15_000, // click, fill...
  navigation: 30_000, // page.goto, waitForURL
  apiRequest: 30_000, // single API call in ApiClient
  poll: 15_000, // expect.poll / custom polling
} as const;
```

---

## Step 8 – Core reusable code (`src/core/`)

### `src/core/api/ApiClient.ts`

```ts
import { APIRequestContext, test } from '@playwright/test';
import { config } from '@config/env.config';
import { Timeouts } from '@config/timeouts';
import { logger } from '../utils/logger';
import { ApiResponseWrapper } from './ApiResponseWrapper';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  /** Send without the Authorization header for this one call */
  skipAuth?: boolean;
}

/**
 * Single reusable HTTP engine for the whole framework.
 * - base URL + auth header handling
 * - timing, logging, and request/response attachments in the HTML report
 * - returns a parsed ApiResponseWrapper, never a raw stream
 * Services (AuthService, UserService…) compose this class; tests can also use it directly.
 */
export class ApiClient {
  private token?: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = config.apiBaseUrl,
    private readonly authScheme: string = 'Bearer', // header becomes "Authorization: Bearer <token>"
  ) {}

  setToken(token?: string): this {
    this.token = token;
    return this;
  }

  clearToken(): this {
    this.token = undefined;
    return this;
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  get = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('GET', endpoint, opts);
  post = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('POST', endpoint, opts);
  put = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('PUT', endpoint, opts);
  patch = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('PATCH', endpoint, opts);
  delete = <T = unknown>(endpoint: string, opts?: RequestOptions) => this.send<T>('DELETE', endpoint, opts);

  async send<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    opts: RequestOptions = {},
  ): Promise<ApiResponseWrapper<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...opts.headers,
    };
    if (this.token && !opts.skipAuth) headers.Authorization = `${this.authScheme} ${this.token}`;

    logger.debug(`--> ${method} ${url}`, opts.body);
    const started = Date.now();
    const response = await this.request.fetch(url, {
      method,
      headers,
      params: opts.query,
      data: opts.body,
      timeout: Timeouts.apiRequest,
      failOnStatusCode: false, // never throw on 4xx/5xx – tests assert the status themselves
    });
    const durationMs = Date.now() - started;

    const text = await response.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      /* non-JSON body – keep raw text */
    }

    const wrapped = new ApiResponseWrapper<T>(
      method,
      url,
      response.status(),
      response.headers(),
      body as T,
      durationMs,
    );
    logger.info(`<-- ${method} ${url} ${wrapped.status} (${durationMs} ms)`);
    await this.attach(wrapped, opts.body);
    return wrapped;
  }

  /** Attach request/response to the Playwright report (only when called inside a test) */
  private async attach(res: ApiResponseWrapper, requestBody: unknown): Promise<void> {
    try {
      const safeBody = maskSecrets(requestBody);
      await test.info().attach(`${res.method} ${new URL(res.url).pathname} → ${res.status}`, {
        body: JSON.stringify({ request: safeBody, response: res.body, durationMs: res.durationMs }, null, 2),
        contentType: 'application/json',
      });
    } catch {
      /* outside a test (e.g. worker fixture) – nothing to attach to */
    }
  }
}

// Replaces password/token/secret values with *** before they go into the report
function maskSecrets(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  return JSON.parse(
    JSON.stringify(body, (key, value) => (/password|token|secret/i.test(key) ? '***' : value)),
  );
}
```

> `authScheme` defaults to `'Bearer'` (most APIs). If your API expects `Authorization: Token <x>`, pass `'Token'`.

### `src/core/api/ApiResponseWrapper.ts`

```ts
import { getByPath } from '../utils/jsonPath';

/** Immutable, already-parsed snapshot of an API response – safe to assert on many times */
export class ApiResponseWrapper<T = unknown> {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number,
    readonly headers: Record<string, string>,
    readonly body: T,
    readonly durationMs: number,
  ) {}

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  /** Read a nested field, e.g. field('user.email') or field('items[0].id') */
  field<V = unknown>(path: string): V {
    return getByPath(this.body, path) as V;
  }

  toString(): string {
    return `${this.method} ${this.url} -> ${this.status} (${this.durationMs} ms)\n${JSON.stringify(this.body, null, 2)}`;
  }
}
```

### `src/core/assertions/api.matchers.ts`

```ts
import { isDeepStrictEqual } from 'node:util';
import { expect as baseExpect } from '@playwright/test';
import { ApiResponseWrapper } from '../api/ApiResponseWrapper';
import { validateSchema } from '../utils/schemaValidator';

/**
 * Custom, reusable API assertions plugged into Playwright's `expect`:
 *
 *   await expect(res).toHaveStatus(201);
 *   await expect(res).toMatchSchema('user');          // src/api/schemas/user.schema.json
 *   await expect(res).toHaveField('user.email', email);
 *   await expect(res).toRespondWithin(2000);
 *
 * Failure messages include the full request/response for fast debugging.
 */
export const expect = baseExpect.extend({
  toHaveStatus(received: ApiResponseWrapper, expected: number) {
    const pass = received.status === expected;
    return {
      pass,
      name: 'toHaveStatus',
      expected,
      actual: received.status,
      message: () =>
        `${this.utils.matcherHint('toHaveStatus', undefined, undefined, { isNot: this.isNot })}\n\n` +
        `Expected status: ${pass ? 'not ' : ''}${expected}\nReceived: ${received.toString()}`,
    };
  },

  toMatchSchema(received: ApiResponseWrapper, schemaName: string) {
    const { valid, errors } = validateSchema(schemaName, received.body);
    return {
      pass: valid,
      name: 'toMatchSchema',
      message: () =>
        valid
          ? `Expected response NOT to match schema "${schemaName}"`
          : `Schema "${schemaName}" violations:\n  ${errors.join('\n  ')}\n\nBody: ${JSON.stringify(received.body, null, 2)}`,
    };
  },

  toHaveField(received: ApiResponseWrapper, path: string, expected?: unknown) {
    const actual = received.field(path);
    const exists = actual !== undefined;
    const pass = expected === undefined ? exists : isDeepStrictEqual(actual, expected);
    return {
      pass,
      name: 'toHaveField',
      expected,
      actual,
      message: () =>
        expected === undefined
          ? `Expected field "${path}" ${this.isNot ? 'not ' : ''}to exist`
          : `Field "${path}"\nExpected: ${this.utils.printExpected(expected)}\nReceived: ${this.utils.printReceived(actual)}`,
    };
  },

  toRespondWithin(received: ApiResponseWrapper, maxMs: number) {
    const pass = received.durationMs <= maxMs;
    return {
      pass,
      name: 'toRespondWithin',
      expected: maxMs,
      actual: received.durationMs,
      message: () => `${received.method} ${received.url} took ${received.durationMs} ms (limit ${maxMs} ms)`,
    };
  },
});
```

### `src/core/ui/BasePage.ts`

```ts
import { Locator, Page, Response, expect, test } from '@playwright/test';
import { logger } from '../utils/logger';

/**
 * Reusable UI actions shared by every page object.
 * Pages describe WHAT is on the screen; BasePage knows HOW to interact safely.
 * All methods rely on Playwright auto-waiting – no hard sleeps anywhere.
 */
export abstract class BasePage {
  /** Relative path of the page, e.g. '/login'. Override in subclasses. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  // ---------- navigation ----------
  async open(pathOverride?: string): Promise<void> {
    const target = pathOverride ?? this.path;
    logger.debug(`Navigating to ${target}`);
    await this.page.goto(target);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(escapeRegex(fragment)));
  }

  // ---------- actions ----------
  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  async typeSlowly(locator: Locator, value: string, delayMs = 50): Promise<void> {
    await locator.pressSequentially(value, { delay: delayMs });
  }

  async selectByLabel(locator: Locator, label: string): Promise<void> {
    await locator.selectOption({ label });
  }

  async check(locator: Locator, checked = true): Promise<void> {
    await locator.setChecked(checked);
  }

  async press(locator: Locator, key: string): Promise<void> {
    await locator.press(key);
  }

  async uploadFile(locator: Locator, filePath: string | string[]): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  async getText(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
  }

  async getAllTexts(locator: Locator): Promise<string[]> {
    return (await locator.allInnerTexts()).map((t) => t.trim());
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  // ---------- network helpers ----------
  /** Run an action and return the matching backend response (e.g. capture an id the UI created) */
  async actionAndWaitForResponse(
    action: () => Promise<void>,
    urlPart: string,
    method = 'GET',
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes(urlPart) && r.request().method() === method.toUpperCase(),
      ),
      action(),
    ]);
    return response;
  }

  /** Accept the next browser dialog (confirm/alert) */
  acceptNextDialog(): void {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  // ---------- assertions ----------
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  async expectContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  async expectTextOnPage(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  // ---------- evidence ----------
  async attachScreenshot(name: string): Promise<void> {
    await test
      .info()
      .attach(name, { body: await this.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### `src/core/ui/BaseComponent.ts`

```ts
import { Locator, Page } from '@playwright/test';

/**
 * A reusable piece of UI that appears on many pages (header, modal, table, toast…).
 * Every locator is scoped to `root`, so components never clash with the rest of the page.
 */
export abstract class BaseComponent {
  protected readonly root: Locator;

  constructor(
    protected readonly page: Page,
    root: Locator,
  ) {
    this.root = root;
  }

  async isDisplayed(): Promise<boolean> {
    return this.root.isVisible();
  }
}
```

### `src/core/utils/logger.ts`

```ts
import { config } from '@config/env.config';

// Minimal levelled logger – set LOG_LEVEL=debug|info|warn|error in env
type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const current = (config.logLevel as Level) in order ? (config.logLevel as Level) : 'info';

function log(level: Level, message: string, meta?: unknown): void {
  if (order[level] < order[current]) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const out = level === 'error' ? console.error : console.log;
  if (meta === undefined) out(line);
  else out(line, typeof meta === 'string' ? meta : JSON.stringify(meta));
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
};
```

### `src/core/utils/step.decorator.ts`

```ts
import { test } from '@playwright/test';

/**
 * Method decorator that wraps a page-object / service method in `test.step`.
 * The HTML report and trace then show readable business steps, e.g.
 *   "LoginPage.login" → "UserService.create"
 * Outside a running test it simply calls the method.
 *
 *   @step()                    → step named "ClassName.method"
 *   @step('Create user')       → custom name
 *
 * Decorators only work on CLASS methods (page objects, services).
 * Inside a spec file use: await test.step('name', async () => { ... })
 */
export function step(name?: string) {
  return function decorator<This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>,
  ) {
    return function replacement(this: This, ...args: Args): Promise<Return> {
      const className = (this as { constructor: { name: string } }).constructor.name;
      const stepName = name ?? `${className}.${String(context.name)}`;
      try {
        test.info();
      } catch {
        return target.call(this, ...args); // not inside a test (e.g. worker fixture)
      }
      return test.step(stepName, () => target.call(this, ...args), { box: true });
    };
  };
}
```

### `src/core/utils/CleanupManager.ts`

```ts
import { logger } from './logger';

type CleanupFn = () => Promise<unknown>;

/**
 * Collects teardown actions during a test and runs them afterwards in reverse order,
 * whether the test passed or failed. Provided per test by the `cleanup` fixture.
 */
export class CleanupManager {
  private readonly tasks: { name: string; fn: CleanupFn }[] = [];

  add(name: string, fn: CleanupFn): void {
    this.tasks.push({ name, fn });
  }

  /** Drains the queue, so calling it twice is safe */
  async run(): Promise<void> {
    for (const { name, fn } of this.tasks.splice(0).reverse()) {
      try {
        await fn();
        logger.debug(`Cleanup done: ${name}`);
      } catch (error) {
        logger.warn(`Cleanup failed: ${name}`, String(error));
      }
    }
  }
}
```

### `src/core/utils/schemaValidator.ts`

```ts
import Ajv, { ValidateFunction } from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });
const cache = new Map<string, ValidateFunction>(); // compile each schema only once
const SCHEMA_DIR = path.resolve(process.cwd(), 'src/api/schemas');

/** Validates data against src/api/schemas/<name>.schema.json. Returns readable errors. */
export function validateSchema(schemaName: string, data: unknown): { valid: boolean; errors: string[] } {
  let validate = cache.get(schemaName);
  if (!validate) {
    const file = path.join(SCHEMA_DIR, `${schemaName}.schema.json`);
    if (!fs.existsSync(file)) throw new Error(`Schema not found: ${file}`);
    validate = ajv.compile(JSON.parse(fs.readFileSync(file, 'utf-8')));
    cache.set(schemaName, validate);
  }
  const valid = validate(data) as boolean;
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message}`);
  return { valid, errors };
}
```

### `src/core/utils/jsonPath.ts`

```ts
/**
 * Reads a value with a simple dot / index path:
 *   getByPath(body, 'user.email')
 *   getByPath(body, 'items[0].name')
 */
export function getByPath(source: unknown, path: string): unknown {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), source);
}
```

---

## Step 9 – Fixtures (`src/fixtures/`)

### `src/fixtures/base.fixture.ts`

```ts
import { test as base } from '@playwright/test';
import { CleanupManager } from '@core/utils/CleanupManager';
import { logger } from '@core/utils/logger';

type BaseFixtures = {
  /** Register teardown work: cleanup.add('delete user', () => ...) */
  cleanup: CleanupManager;
  /** Auto fixture: logs start/end of every test (replaces global hooks) */
  _testLogger: void;
};

/** Layer 1 – cross-cutting concerns used by every test */
export const baseTest = base.extend<BaseFixtures>({
  cleanup: async ({}, use) => {
    const manager = new CleanupManager();
    await use(manager);
    await manager.run();
  },

  _testLogger: [
    async ({}, use, testInfo) => {
      logger.info(`▶ START  ${testInfo.titlePath.slice(1).join(' › ')}`);
      await use();
      const icon = testInfo.status === testInfo.expectedStatus ? '✔' : '✖';
      logger.info(
        `${icon} ${String(testInfo.status).toUpperCase()}  ${testInfo.title} (${testInfo.duration} ms)`,
      );
    },
    { auto: true },
  ],
});
```

### `src/fixtures/index.ts` (starting version)

```ts
/**
 * Single import for every test:
 *   import { test, expect } from '@fixtures/index';
 * `test` carries all fixture layers; `expect` includes the custom API matchers.
 *
 * Starting version: only the base layer. As the framework grows, extend it in layers, e.g.
 *   baseTest → apiTest (logged-in ApiClient/services) → uiTest (page objects)
 * and point `test` at the last layer.
 */
import { baseTest } from './base.fixture';

export const test = baseTest;
export { expect } from '@core/assertions/api.matchers';
```

---

## Step 10 – Check that everything works

```bash
npm run typecheck                 # TypeScript compiles – no output means OK
npm run lint                      # no ESLint errors
npm run format                    # format all files once
npx playwright test --list        # Playwright loads the config and finds tests
```

Quick smoke test – create `tests/api/health.api.spec.ts`:

```ts
import { test, expect } from '@fixtures/index';
import { ApiClient } from '@core/api/ApiClient';

test('API is reachable', async ({ request }) => {
  const res = await new ApiClient(request).get('/health'); // change to any public endpoint of your API
  await expect(res).toHaveStatus(200);
});
```

```bash
npm run test:api
npm run report                    # open the HTML report
```

**Common errors**

| Error | Fix |
|---|---|
| `Missing env variable "UI_BASE_URL"` | `env/.env.local` missing or the key is empty – see Step 6.2 |
| `Cannot find module '@config/env.config'` | check `paths` in `tsconfig.json` and that the file exists |
| `ENOENT … .auth/user.json` | `ui`/`e2e` need the `setup` project – write `tests/setup/auth.setup.ts` first |
| Browser fails to launch on Linux | `npx playwright install --with-deps` |

---

## Next steps (per application)

1. `tests/setup/auth.setup.ts` – log in once (API or UI) and save `storageState` to `config.authFile`.
2. `src/api/services/*` – one service per API area, built on `ApiClient`, methods decorated with `@step()`.
3. `src/api/schemas/*.schema.json` – JSON schemas for `toMatchSchema`.
4. `src/pages/*` – page objects extending `BasePage`; locators in the constructor, actions with `@step()`.
5. `src/fixtures/*` – add fixtures for your services and pages, then export them from `index.ts`.
