# Playwright Notes — WorkFlow Manager

Personal cheat sheet, revision notes and snippet library. Updated after every lesson.

**Progress:** Lesson 1 ✅ · Login topic ✅ (`e2e/login.spec.ts`: page load, fields, placeholders, validation, checkbox, success, invalid, logout, protected redirect) · Next: Lesson 2 (config + baseURL)

App quick reference: web `http://localhost:5173` · API `http://localhost:4000/api` · admin `test.user@example.com` / `Test@12345` · viewer `viewer.user@example.com` / `Test@12345` · reset data with `npm run db:seed`

**How to run** (terminal 1: `npm run dev` · terminal 2: one of these)
```bash
npm run test:e2e           # headless, all tests
npm run test:e2e:headed    # watch the browser
npm run test:e2e:ui        # interactive UI mode (best for learning)
npm run test:e2e:report    # open last HTML report
npx playwright test e2e/login.spec.ts   # one file
```
Tests live in `e2e/`, config in `playwright.config.ts` (explained in Lesson 2).

---

# Playwright & E2E Testing

## Definition
**Playwright** is an open-source browser-automation library plus test runner from Microsoft. It drives real Chromium, Firefox and WebKit browsers from code (TS/JS, Python, Java, .NET).

**E2E (end-to-end) test:** a test that drives the real UI in a real browser, against a running frontend, backend and database, to verify a full user journey.

## Why It Is Used
- Unit and component tests can't prove that the app works as a *system*: routing, cookies, the API contract, the DB, the browser itself.
- E2E tests catch integration bugs. In WorkFlow Manager, for example, a React button reused as a `submit` button submitted the 4-step form early. Only a real browser click exposed it.
- Playwright stays reliable by **auto-waiting** before every action and assertion.

| Layer | Speed | Confidence | Count |
|-------|-------|------------|-------|
| Unit | fastest | low (one piece) | many |
| API / integration | fast | medium | some |
| E2E (Playwright) | slowest | highest (whole journey) | few, for critical flows |

## Syntax
```ts
import { test, expect } from '@playwright/test';
```

## Example
```ts
test('page has a title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});
```

## WorkFlow Manager Example
See the "Test" and "Assertion" sections below.

## Useful Snippets
```bash
npx playwright test            # run all tests (setup comes in Lesson 2)
```

## Common Mistakes
- Trying to E2E-test every edge case. Keep E2E for critical journeys and push the details down to API or unit tests.
- Treating E2E like a manual script ("click, sleep 2s, click").

## Best Practices
- Test what the **user** sees and does, not implementation details (CSS classes, component state).
- Each test should be independent and runnable on its own.

---

# Playwright Architecture

## Definition
Your test code (Node.js) is the **client**. It sends commands to the **Playwright server/driver**, which controls the browser over a debugging protocol.

```
test.spec.ts ──► Playwright client (Node) ──WebSocket/pipe──► Playwright driver
                                                                 ├─ CDP ─────────► Chromium
                                                                 ├─ Juggler* ────► Firefox
                                                                 └─ WK protocol* ► WebKit
                                       (* Playwright ships patched builds of these browsers)
```

## Why It Is Used
- **Out-of-process:** the test code does not run inside the web page, so it can handle multiple tabs, origins, iframes, downloads and browser contexts.
- One API covers 3 engines, so cross-browser tests come for free.
- Commands and events go over a fast persistent connection, not HTTP polling (unlike classic Selenium/WebDriver).

## Syntax
Every browser interaction is async, so you always `await` it.
```ts
await page.goto('/login');
```

## Example
```ts
// Library-style (no test runner): shows the raw objects
import { chromium } from '@playwright/test';

const browser = await chromium.launch();      // starts a browser process
const context = await browser.newContext();   // fresh, isolated "profile"
const page = await context.newPage();         // a tab
await page.goto('http://localhost:5173/login');
await browser.close();
```

## WorkFlow Manager Example
Our app's session is an httpOnly cookie, `wf_token`. Playwright reads and writes cookies at the **browser-context level** through the protocol. That is why tests can later save and reuse login state (`storageState`) even though JavaScript in the page can't read the cookie.

## Useful Snippets
```ts
import { chromium, firefox, webkit } from '@playwright/test';
```

## Common Mistakes
- Forgetting `await`. The command is then fired-and-forgotten and the test races itself.
- Assuming the test runs "in" the page. To run code inside the page you need `page.evaluate()` (covered later).

## Best Practices
- Let the test runner create browsers, contexts and pages (fixtures) rather than launching them by hand.

---

# Browser vs BrowserContext vs Page

## Definition
| Object | What it is | Analogy |
|--------|------------|---------|
| `Browser` | One running browser process (Chromium/Firefox/WebKit) | Opening the Chrome app |
| `BrowserContext` | An isolated session inside a browser: own cookies, localStorage, cache, permissions | A fresh incognito window |
| `Page` | One tab inside a context | A tab |

Hierarchy: **Browser → many Contexts → many Pages**.

## Why It Is Used
- Launching a browser is expensive (about a second). Creating a context is cheap (milliseconds).
- Playwright reuses one browser per worker and gives **every test a brand-new context**. That gives full isolation without paying the browser start-up cost.
- Multiple contexts in one test let you simulate multiple users (admin + viewer) at the same time.

## Syntax
```ts
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await context.close();   // closes its pages too
await browser.close();
```

## Example
```ts
// Two independent users in one test
const adminContext = await browser.newContext();
const viewerContext = await browser.newContext();
const adminPage = await adminContext.newPage();
const viewerPage = await viewerContext.newPage();
```

## WorkFlow Manager Example
- The `wf_token` cookie lives in the **context**. A new context means logged out, which is why every test starts at the login page unless we give it saved state.
- Two pages in the **same** context share the cookie: log in on one tab and the other tab is logged in too.
- Two **different** contexts don't share it: admin and viewer can be logged in side by side.

## Useful Snippets
```ts
page.context();                 // context that owns this page
context.pages();                // all tabs in a context
await context.clearCookies();   // simulate logout / expired session
```

## Common Mistakes
- Sharing one page or context across tests, so state leaks between them (flaky, order-dependent tests).
- Launching a new browser per test (slow) when a new context is enough.

## Best Practices
- One test = one fresh context (the runner's default).
- Use extra contexts only for multi-user scenarios.

---

# test()

## Definition
`test(title, async ({ fixtures }) => { ... })` declares one test case in the Playwright Test runner. The runner injects ready-made objects called **fixtures**, such as `page`, `context` and `browser`.

## Why It Is Used
The runner handles discovery, parallel workers, retries, timeouts, reporting and fresh isolation per test. You only write the scenario.

## Syntax
```ts
import { test, expect } from '@playwright/test';

test('descriptive title', async ({ page }) => {
  // arrange → act → assert
});
```

## Example
```ts
test('example.com has a heading', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

## WorkFlow Manager Example
```ts
import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await expect(page).toHaveTitle('Login | WorkFlow Manager');
  await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
});
```

## Useful Snippets
```ts
test('title', async ({ page, context, browser, browserName }) => {});
```

## Common Mistakes
- Vague titles like `'test 1'`. The title is what you read in a failure report.
- One giant test that checks ten unrelated things. When it fails, you don't know which.

## Best Practices
- Title = expected behaviour: `'shows error for invalid credentials'`.
- Keep tests independent. Never rely on another test having run first.

---

# Assertion — expect()

## Definition
An **assertion** checks that the app is in the expected state. Playwright's `expect` adds **web-first assertions**: they take a locator or page and **retry automatically** until the condition passes or the timeout (default 5s) runs out.

## Why It Is Used
UIs are async: data loads, toasts appear and routes change. A one-shot check fails if it runs a few milliseconds too early. A retrying assertion waits for the real state, which removes most flakiness without `sleep`.

## Syntax
```ts
await expect(locator).toBeVisible();       // web-first: retries, so await it
await expect(page).toHaveURL(/dashboard/);
expect(2 + 2).toBe(4);                     // generic: checks once, no await
```

## Example
```ts
await expect(page.getByRole('heading')).toHaveText('Welcome');
```

## WorkFlow Manager Example
```ts
await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
```
**Locator vs assertion:** `page.getByRole(...)` is a lazy *description* of how to find an element and does nothing by itself. `expect(...).toBeVisible()` actually queries the page, and keeps re-querying until the element is visible.

## Useful Snippets
```ts
await expect(page).toHaveTitle('Login | WorkFlow Manager');
await expect(locator).toBeVisible();
```

## Common Mistakes
- Missing `await` on a web-first assertion. The test can finish before the check runs.
- `expect(await locator.isVisible()).toBe(true)` reads the state once with no retry, so it is flaky. Prefer `await expect(locator).toBeVisible()`.

## Best Practices
- Always prefer web-first (`await expect(locator)...`) assertions for anything on the page.
- Assert what the user can observe (text, visibility, URL), not internals.

---

# getByPlaceholder()

## Definition
Finds an input or textarea by its `placeholder` attribute (the grey hint text inside an empty field).

## Why It Is Used
For fields that have **no label**, the placeholder is often the only stable, user-visible text (e.g. a search box).

## Syntax
```ts
page.getByPlaceholder('Search by name')                 // substring, case-insensitive
page.getByPlaceholder('Search by name', { exact: true }) // full, case-sensitive match
```

## Example
```ts
await expect(page.getByPlaceholder('Search')).toBeVisible();
```

## WorkFlow Manager Example
```ts
// Employees page search box
await expect(page.getByPlaceholder('Search by name, email or employee ID')).toBeVisible();
```

## Useful Snippets
```ts
// Verify a field's placeholder text (prefer this when the field has a label)
await expect(page.getByLabel('Search')).toHaveAttribute('placeholder', 'Search by name, email or employee ID');
```

## Common Mistakes
- Using the placeholder as the main way to find a field that **has a label**. Placeholders are hints that change often and vanish while typing.
- Forgetting the match is a substring by default.

## Best Practices
- Locator priority: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId`.
- To **check** placeholder text, find the field by label, then assert `toHaveAttribute('placeholder', ...)`.

---

# Field-state assertions

## Definition
Web-first matchers that check an element's state or attributes, retrying until they pass or time out.

## Why It Is Used
"Rendered" means more than "exists". A field can be in the DOM but hidden, disabled, pre-filled, or of the wrong type.

## Syntax
| Matcher | Checks |
|---------|--------|
| `toBeVisible()` | In the DOM, has a size, not `display:none` / `visibility:hidden` |
| `toBeEditable()` | Enabled and not read-only, so the user can type |
| `toBeEmpty()` | Input has no value (or element has no text) |
| `toHaveAttribute(name, value)` | Attribute equals the value (string or RegExp) |
| `toHaveValue(value)` | Current value of an input |

## Example
```ts
await expect(page.getByLabel('Search')).toBeEditable();
await expect(page.getByLabel('Search')).toHaveAttribute('type', 'search');
```

## WorkFlow Manager Example
```ts
// Profile page: email is shown but must not be editable
await expect(page.getByLabel('Email')).not.toBeEditable();
```

## Useful Snippets
```ts
await expect(locator).not.toBeVisible();          // negate any matcher with .not
await expect(locator).toHaveAttribute('type', 'password');
```

## Common Mistakes
- Checking only `toBeVisible()` when the real requirement is "the user can type here" (`toBeEditable()`).
- `expect(await locator.getAttribute('placeholder')).toBe(...)` reads the value once with no retry. Use `toHaveAttribute`.

## Best Practices
- Assert the behaviour that matters to the user, such as a masked password (`type="password"`) or a usable field.

---

# Checkboxes — getByRole('checkbox') & toBeChecked()

## Definition
A checkbox has the accessible role `checkbox`. Its accessible name comes from its `<label>` text.

## Why It Is Used
Checkboxes are on/off state ("Remember me", "I agree to terms"). Tests should verify both that the checkbox is **present** and that its **state** (checked or unchecked) is correct.

## Syntax
```ts
page.getByRole('checkbox', { name: 'Label text' })
page.getByLabel('Label text')                        // also works

await expect(checkbox).toBeVisible();
await expect(checkbox).toBeChecked();                // is ticked
await expect(checkbox).not.toBeChecked();            // is NOT ticked
await checkbox.check();                               // tick it (no-op if already ticked)
await checkbox.uncheck();                             // untick it
```

## Example
```ts
const terms = page.getByRole('checkbox', { name: 'I agree to the Terms & Conditions' });
await expect(terms).toBeVisible();
await expect(terms).not.toBeChecked();
```

## WorkFlow Manager Example
Signup page: the terms checkbox (above). On the login page, "Remember me" is the same pattern.

## Useful Snippets
```ts
await checkbox.setChecked(true);   // set to an exact state
```

## Common Mistakes
- Using `.click()` to tick: it **toggles**, so if the box was already ticked, click unticks it. `check()` always ends ticked.
- Checking only visibility and not the default state (a box that is pre-ticked by mistake is a real bug).

## Best Practices
- Prefer `getByRole('checkbox', { name })`: it confirms both the element type and its label.
- Use `check()` / `uncheck()` over `click()` for checkboxes.

---

# fill()

## Definition
`locator.fill(value)` focuses an input, **clears** it, and sets the new value in one step, firing the `input` event the app listens to.

## Why It Is Used
The standard way to type into text inputs, textareas and contenteditable elements. It auto-waits until the field is visible, enabled and editable.

## Syntax
```ts
await locator.fill('text');
await locator.fill('');            // clear a field
```

## Example
```ts
await page.getByLabel('Email').fill('user@example.com');
```

## WorkFlow Manager Example
```ts
await page.getByLabel('Email').fill('test.user@example.com');
await page.getByLabel('Password').fill('Test@12345');
await page.getByRole('button', { name: 'Log in' }).click();
```

## Useful Snippets
```ts
await expect(page.getByLabel('Email')).toHaveValue('test.user@example.com'); // verify what was typed
await locator.pressSequentially('abc');  // types key-by-key (only when the app reacts per keystroke)
```

## Common Mistakes
- Clearing manually before `fill()`. `fill()` already replaces the old value.
- Using `pressSequentially()` / `type()` everywhere. It's slower and only needed for per-key behaviour.

## Best Practices
- Locate inputs with `getByLabel`, then `fill()`.
- Keep test credentials in one place (later: env vars / fixtures), never real secrets.

---

# toHaveURL()

## Definition
A web-first page assertion: it waits until the page URL matches a string or RegExp (default 5s).

## Why It Is Used
After a click, navigation usually happens **later** (API call → response → client-side redirect). `toHaveURL` waits for it, so you never need `sleep()`.

## Syntax
```ts
await expect(page).toHaveURL('http://localhost:5173/dashboard'); // exact full URL
await expect(page).toHaveURL(/\/dashboard$/);                    // RegExp: path ends with /dashboard
await expect(page).not.toHaveURL(/\/login/);
```

## Example
```ts
await expect(page).toHaveURL(/\/dashboard/);
```

## WorkFlow Manager Example
```ts
// Empty submit must NOT log in
await expect(page).toHaveURL(/\/login/);
// Protected page while logged out → redirected with return path
await expect(page).toHaveURL(/\/login\?redirect=%2Femployees/);
```

## Useful Snippets
```ts
await page.waitForURL(/\/dashboard/);   // wait without asserting (rarely needed)
```

## Common Mistakes
- Hardcoding the full host and port in every test (breaks across environments). Use `baseURL` + RegExp or path.
- Treating a URL change as proof of success. Also assert the page **content** (heading, user name).

## Best Practices
- Pair URL checks with a visible-content check.
- "Stays on the same page" checks pass instantly (the URL is already correct). Assert the **result first** (error message), then the URL, otherwise the test can pass before the server has even answered.
- Prefer RegExp for paths with query strings or dynamic IDs (`/\/employees\/\d+$/`).

---

# playwright.config.ts

## Definition
The single configuration file the test runner reads before running anything: where tests are, which browsers, timeouts, reporters, default page options (`use`) and how to start the app (`webServer`).

## Why It Is Used
Keeps environment details (URL, browsers, timeouts) **out of the tests**. Change one line instead of every test file.

## Syntax
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir: './e2e', use: { baseURL: '...' }, projects: [...] });
```

| Option | Meaning | Our value |
|--------|---------|-----------|
| `testDir` | folder with `*.spec.ts` files | `./e2e` |
| `fullyParallel` | tests in the same file run in parallel too | `true` |
| `forbidOnly` | fail if `test.only` is committed | `true` in CI |
| `retries` | re-run failed tests | `2` in CI, `0` locally |
| `workers` | parallel processes | auto locally, `1` in CI |
| `reporter` | output formats | `list` + `html` |
| `timeout` | max time for **one test** | 30s |
| `expect.timeout` | max retry time for **one assertion** | 5s |
| `use.baseURL` | prefix for relative URLs | `http://localhost:5173` |
| `use.trace` / `screenshot` / `video` | evidence on failure | `retain-on-failure` / `only-on-failure` |
| `projects` | browser/device setups to run | Desktop Chrome |
| `webServer` | commands to start the app + URL to wait for | backend + frontend |

## Example
```ts
use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' }
```

## WorkFlow Manager Example
```ts
webServer: [
  { command: 'npm run dev:backend',  url: 'http://localhost:4000/api/health', reuseExistingServer: !isCI },
  { command: 'npm run dev:frontend', url: 'http://localhost:5173',            reuseExistingServer: !isCI },
],
```

## Useful Snippets
```bash
npx playwright test                       # all tests, headless
npx playwright test --headed              # see the browser
npx playwright test --ui                  # UI mode
npx playwright test e2e/login.spec.ts     # one file
npx playwright test -g "log out"          # tests whose title matches
npx playwright test --workers=1           # no parallelism
npx playwright show-report                # open HTML report
BASE_URL=http://other:5173 npx playwright test   # override baseURL via env
```

## Common Mistakes
- Hardcoding `http://localhost:5173` in tests instead of using `baseURL`.
- Confusing `timeout` (whole test) with `expect.timeout` (one assertion).
- `webServer.url` pointing at a page that returns 200 before the app is really ready (we wait on the API health check **and** the frontend).
- Raising timeouts to "fix" flaky tests (hides the real problem).

## Best Practices
- Read environment-specific values from env vars with a local default.
- Collect traces/screenshots/videos **only on failure** to keep runs fast.
- `reuseExistingServer: !CI`: fast locally, always a clean start in CI.

---

# baseURL

## Definition
`use.baseURL` is a URL prefix. Relative URLs in `page.goto()`, `toHaveURL()`, `waitForURL()` and API requests are resolved against it.

## Why It Is Used
Tests become environment-independent: the same test runs against local, staging or CI by changing one value.

## Syntax
```ts
await page.goto('/login');                       // → http://localhost:5173/login
await expect(page).toHaveURL('/dashboard');      // string is resolved with baseURL too
await expect(page).toHaveURL(/\/dashboard$/);    // RegExp: never uses baseURL
```

## Example
```ts
await page.goto('/employees');
await expect(page).toHaveURL('/login?redirect=%2Femployees');
```

## WorkFlow Manager Example
See above: verified against our app.

## Useful Snippets
```ts
await page.goto('/');            // app root
await page.goto('/employees/1'); // deep link
```

## Common Mistakes
- Inconsistent slashes when `baseURL` has a path (e.g. `http://host/app`): `goto('/login')` → `http://host/login` (drops `/app`!), `goto('login')` with baseURL `http://host/app/` → `http://host/app/login`. Keep baseURL at the origin, or end it with `/` and use paths without a leading `/`.
- Mixing absolute and relative URLs in the same suite.

## Best Practices
- Tests should contain **paths only**, never hosts or ports.
