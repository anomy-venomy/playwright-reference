# Playwright Reports – Theory + Code

A reference for everything about **test results**: which reporters exist, what each one is for, how to set them up, how to put evidence in them (screenshots, traces, API calls, logs), how to write your own reporter, and how CI uses them.

Every section has:
- **Theory**: what it is and why it exists
- **Code**: a snippet you can copy
- **🧩 In this project**: where the idea is already used in this framework (when it is)

> Related files: [LOCATORS_CHEATSHEET.md](LOCATORS_CHEATSHEET.md) · [LOCATORS_THEORY.md](LOCATORS_THEORY.md) · [Readme.setup.md](Readme.setup.md)

---

## Contents

**Part A – Basics**
1. [What a reporter is](#1-what-a-reporter-is)
2. [Test statuses: passed, failed, flaky, skipped](#2-test-statuses-passed-failed-flaky-skipped)
3. [Where everything is written (folders)](#3-where-everything-is-written-folders)

**Part B – Built-in reporters**
4. [list](#4-list)
5. [line](#5-line)
6. [dot](#6-dot)
7. [html](#7-html)
8. [json](#8-json)
9. [junit](#9-junit)
10. [blob](#10-blob)
11. [github](#11-github)
12. [null](#12-null)
13. [Using several reporters at once](#13-using-several-reporters-at-once)
14. [Choosing reporters from the command line or env vars](#14-choosing-reporters-from-the-command-line-or-env-vars)

**Part C – Evidence inside the report**
15. [Screenshots, videos, traces (automatic artifacts)](#15-screenshots-videos-traces-automatic-artifacts)
16. [The Trace Viewer](#16-the-trace-viewer)
17. [Steps (test.step and @step)](#17-steps-teststep-and-step)
18. [Attachments (testInfo.attach)](#18-attachments-testinfoattach)
19. [Annotations (issue links, notes)](#19-annotations-issue-links-notes)
20. [Tags in the report](#20-tags-in-the-report)
21. [Console output and logs](#21-console-output-and-logs)
22. [Masking secrets and personal data](#22-masking-secrets-and-personal-data)

**Part D – Beyond the built-ins**
23. [Writing a custom reporter](#23-writing-a-custom-reporter)
24. [Custom reporter: summary file + Slack/Teams message](#24-custom-reporter-summary-file--slackteams-message)
25. [Reading results.json with a script](#25-reading-resultsjson-with-a-script)
26. [Allure report](#26-allure-report)
27. [Monocart report](#27-monocart-report)

**Part E – CI**
28. [Sharding and merging reports](#28-sharding-and-merging-reports)
29. [GitHub Actions: upload and publish the report](#29-github-actions-upload-and-publish-the-report)
30. [Jenkins / Azure DevOps / GitLab with JUnit](#30-jenkins--azure-devops--gitlab-with-junit)

**Part F – Practical**
31. [Reports for the loan application (audit evidence)](#31-reports-for-the-loan-application-audit-evidence)
32. [Troubleshooting](#32-troubleshooting)
33. [Quick reference](#33-quick-reference)

---

# Part A – Basics

## 1. What a reporter is

**Theory.** While tests run, Playwright sends **events** ("run started", "test started", "step finished", "test finished", "run finished") to every configured **reporter**. A reporter is just an object that listens to those events and turns them into some output:

| Output | Who reads it | Reporter |
|---|---|---|
| Lines in the terminal | You, while tests run | `list`, `line`, `dot` |
| A web page with screenshots and traces | You or the team, after the run | `html` |
| A machine-readable file | Scripts, dashboards | `json` |
| An XML file every CI tool understands | Jenkins, Azure DevOps, GitLab | `junit` |
| A raw file to merge later | `merge-reports` (sharded CI) | `blob` |
| Annotations on the pull request | GitHub | `github` |

The reporter only **describes** the run. It never changes which tests run or whether they pass.

**Code.**
```ts
// playwright.config.ts
export default defineConfig({
  reporter: 'list', // one reporter, short form
  // reporter: [['list'], ['html', { open: 'never' }]], // several, each with options
});
```

**🧩 In this project:** the `reporters` array at the top of [playwright.config.ts](playwright.config.ts).

---

## 2. Test statuses: passed, failed, flaky, skipped

**Theory.** Every test **result** (one attempt) has a `status`:

| Status | Meaning |
|---|---|
| `passed` | All code ran and no assertion failed |
| `failed` | An assertion or error failed |
| `timedOut` | The test ran longer than `timeout` |
| `skipped` | `test.skip()` / `test.fixme()` or a serial test after a failure |
| `interrupted` | The run was stopped (Ctrl+C, `maxFailures`) |

Each test also has an **expected status**, normally `passed`. With `test.fail()` it becomes `failed`, meaning "I know this is broken; tell me if it suddenly starts passing".

The **outcome** of a test (all attempts together) is what reports show at the top:

| Outcome | Meaning |
|---|---|
| **expected** | Ended as expected (usually passed) |
| **unexpected** | Ended differently from expected (usually failed) → the run fails |
| **flaky** | Failed first, then passed on a retry → the run passes, but the test needs fixing |
| **skipped** | Did not run |

> Retries only exist when `retries > 0`. Without retries a test can never be "flaky"; it is just failed.

**Code.**
```ts
test('known bug', async ({ page }) => {
  test.fail(true, 'BUG-123: total is rounded wrong'); // expected status = failed
  // ...
});

test('slow report export', async ({ page }) => {
  test.slow(); // triples the timeout; shown in the report
});
```

**🧩 In this project:** [src/fixtures/base.fixture.ts](src/fixtures/base.fixture.ts) logs `✔`/`✖` by comparing `testInfo.status` with `testInfo.expectedStatus`. That is exactly the "expected vs unexpected" rule above. Retries are set in [playwright.config.ts](playwright.config.ts) (`retries: config.isCI ? 1 : 0`), so flaky results only appear in CI.

---

## 3. Where everything is written (folders)

**Theory.** There are two kinds of output:
- **Reports**: one per run (HTML site, XML, JSON).
- **Test artifacts**: per test (screenshots, videos, traces, downloaded files). They go into `outputDir`, which is **emptied at the start of each run**.

The HTML report **copies** the artifacts it needs into its own folder, so you can zip and share `reports/html` on its own.

**Code / layout in this project.**
```
reports/                       ← config.reportDir (REPORT_DIR env, default "reports")
├── html/                      ← HTML report: open with  npm run report
├── junit/results.xml          ← for CI tools
├── json/results.json          ← for scripts
├── blob/                      ← only when BLOB_REPORT is set (sharded CI)
└── test-results/              ← outputDir: traces, screenshots, videos per test
```

**🧩 In this project:** `reportDir` in [src/config/env.config.ts](src/config/env.config.ts), and `outputDir: \`${R}/test-results\`` in [playwright.config.ts](playwright.config.ts). Add `reports/` to `.gitignore`; reports are build output, not source.

---

# Part B – Built-in reporters

## 4. list

**Theory.** Default reporter locally. Prints **one line per test** with ✓/✘ and its duration, then the failures in full at the end. Best for local runs with up to a few hundred tests.

**Code.**
```ts
reporter: [['list', { printSteps: true }]], // printSteps also prints every test.step / @step
```
```bash
npx playwright test --reporter=list
```
Output:
```
  ✓  1 [ui] › tests/ui/login.ui.spec.ts:12:7 › login › valid user (1.2s)
  ✘  2 [ui] › tests/ui/login.ui.spec.ts:20:7 › login › wrong password (5.0s)
```

**🧩 In this project:** first entry of `reporters` in [playwright.config.ts](playwright.config.ts), and the only terminal reporter used with `BLOB_REPORT`.

---

## 5. line

**Theory.** Prints **one line that keeps updating** (the current test) and only prints failures permanently. Good for big suites where `list` would flood the terminal. Default in CI.

**Code.**
```bash
npx playwright test --reporter=line
```

---

## 6. dot

**Theory.** The shortest form: one character per test (`·` pass, `F` fail, `×` failed but will retry, `±` flaky, `°` skipped). Useful in CI logs for thousands of tests.

**Code.**
```bash
npx playwright test --reporter=dot
```

---

## 7. html

**Theory.** A self-contained **website** with every test, filter buttons (passed/failed/flaky/skipped), search by title/tag/file, the steps tree, errors with code snippets, and all screenshots, videos, traces and attachments. It's the report you share with people.

It is a static site, so you can open it from any web server. Traces only open over `http://` (not `file://`), which is why `show-report` starts a small server.

| Option | Meaning |
|---|---|
| `outputFolder` | Where to write it (default `playwright-report`) |
| `open` | `'always'`, `'never'`, `'on-failure'` (default locally) |
| `host`, `port` | For `show-report` server |
| `attachmentsBaseURL` | When attachments are hosted somewhere else (e.g. S3) |
| `title` | Title shown at the top of the report |

**Code.**
```ts
reporter: [['html', { outputFolder: 'reports/html', open: 'never', title: 'Loan app – regression' }]],
```
```bash
npx playwright show-report reports/html            # open it
npx playwright show-report reports/html --port 9400  # other port
```

> **Use `open: 'never'` in CI.** Otherwise the run ends by starting a server and waiting forever.

**🧩 In this project:** second entry of `reporters` in [playwright.config.ts](playwright.config.ts); the `report` script in [package.json](package.json) (`npm run report`).

---

## 8. json

**Theory.** Writes the **whole run as one JSON object**: config, the tree of suites/specs/tests, every result (status, duration, errors, attachment paths) and a `stats` summary. Use it when a **script** needs results: a dashboard, a custom e-mail, a "fail if more than N flaky" gate.

Shape (simplified):
```jsonc
{
  "stats": { "startTime": "...", "duration": 81234, "expected": 40, "unexpected": 2, "flaky": 1, "skipped": 3 },
  "suites": [
    {
      "title": "ui/login.ui.spec.ts",
      "specs": [
        {
          "title": "valid user logs in",
          "ok": true,
          "tags": ["@smoke"],
          "tests": [{ "projectName": "ui", "results": [{ "status": "passed", "duration": 1200, "errors": [], "attachments": [] }] }]
        }
      ],
      "suites": [] // nested describe() blocks
    }
  ],
  "errors": [] // errors outside tests (e.g. config or import errors)
}
```

**Code.**
```ts
reporter: [['json', { outputFile: 'reports/json/results.json' }]],
```
```bash
# Without outputFile it prints to the terminal:
npx playwright test --reporter=json > results.json
```

**🧩 In this project:** fourth entry of `reporters` in [playwright.config.ts](playwright.config.ts). See [§25](#25-reading-resultsjson-with-a-script) for a script that reads it.

---

## 9. junit

**Theory.** JUnit XML is the **old standard format** for test results, which nearly every CI server can read (Jenkins, Azure DevOps, GitLab, TeamCity, Bamboo). The CI then shows a "Tests" tab, trends over time and which tests failed, without opening the Playwright report.

```xml
<testsuites tests="45" failures="2" skipped="3" time="81.2">
  <testsuite name="ui/login.ui.spec.ts" tests="3" failures="1">
    <testcase name="login › wrong password" classname="ui/login.ui.spec.ts" time="5.0">
      <failure message="expect(locator).toBeVisible() failed">…stack…</failure>
    </testcase>
  </testsuite>
</testsuites>
```

| Option | Meaning |
|---|---|
| `outputFile` | Where to write the XML |
| `stripANSIControlSequences` | Remove terminal colour codes from messages (cleaner in CI) |
| `includeProjectInTestName` | Prefix test names with `[ui]`, `[api]` (useful with several projects) |
| `embedAnnotationsAsProperties` | Put annotations into `<properties>` |

**Code.**
```ts
reporter: [['junit', { outputFile: 'reports/junit/results.xml', includeProjectInTestName: true, stripANSIControlSequences: true }]],
```

**🧩 In this project:** third entry of `reporters` in [playwright.config.ts](playwright.config.ts) and in [merge.config.ts](merge.config.ts).

---

## 10. blob

**Theory.** A **raw, zipped dump of all reporter events** plus the artifacts. Nobody reads it directly. It exists for **sharding**: when the suite is split across 4 CI machines, each one writes a blob, then `merge-reports` replays all blobs through normal reporters (html, junit…) as if it had been **one** run. See [§28](#28-sharding-and-merging-reports).

**Code.**
```ts
reporter: [['blob', { outputDir: 'reports/blob' }]],
```

**🧩 In this project:** in [playwright.config.ts](playwright.config.ts), setting the `BLOB_REPORT` env var switches the reporters to `blob` + `list`. [merge.config.ts](merge.config.ts) says which reports to build when merging.

---

## 11. github

**Theory.** Only useful inside **GitHub Actions**. It prints failures in GitHub's special log format, so each failure appears as an **annotation on the right file and line** in the pull request "Files changed" view.

**Code.**
```ts
reporter: process.env.GITHUB_ACTIONS ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html']],
```

---

## 12. null

**Theory.** Reports nothing. Used when another tool drives Playwright and only needs the exit code, or in a reporter config you build yourself.

```bash
npx playwright test --reporter=null
```

---

## 13. Using several reporters at once

**Theory.** `reporter` accepts an **array**. Every reporter gets every event, so one run can give you a terminal view, an HTML site, JUnit for CI and JSON for scripts. Only one reporter should print to the terminal (`list`, `line` or `dot`), or the output gets mixed.

**Code.**
```ts
import { defineConfig, ReporterDescription } from '@playwright/test';

const isCI = !!process.env.CI;

const reporters: ReporterDescription[] = [
  [isCI ? 'line' : 'list'],                                  // terminal
  ['html', { outputFolder: 'reports/html', open: 'never' }], // for people
  ['junit', { outputFile: 'reports/junit/results.xml' }],    // for CI
  ['json', { outputFile: 'reports/json/results.json' }],     // for scripts
  ...(isCI ? ([['github']] as ReporterDescription[]) : []),  // PR annotations
];

export default defineConfig({ reporter: reporters });
```

**🧩 In this project:** exactly this pattern in [playwright.config.ts](playwright.config.ts) (`ReporterDescription[]`, switch on `BLOB_REPORT`).

---

## 14. Choosing reporters from the command line or env vars

**Theory.** `--reporter` on the command line **replaces** the config's reporters for that run. Env vars change output paths without editing the config.

**Code.**
```bash
npx playwright test --reporter=dot                 # only dot
npx playwright test --reporter=list,html           # several, comma separated
npx playwright test --reporter=./reporters/summary-reporter.ts   # custom reporter file

PLAYWRIGHT_HTML_OUTPUT_DIR=out/html npx playwright test --reporter=html
PLAYWRIGHT_HTML_OPEN=never           npx playwright test
PLAYWRIGHT_JSON_OUTPUT_NAME=out.json npx playwright test --reporter=json
PLAYWRIGHT_JUNIT_OUTPUT_NAME=out.xml npx playwright test --reporter=junit

# In this project, the whole reports folder can be moved with:
REPORT_DIR=build/reports npx playwright test
```

---

# Part C – Evidence inside the report

## 15. Screenshots, videos, traces (automatic artifacts)

**Theory.** Set in `use`. Playwright records them for you and attaches them to the test in the HTML report. Each one has a cost (time, disk), so choose **when** to keep them:

| Setting | Values | Recommended |
|---|---|---|
| `screenshot` | `'off'`, `'on'`, `'only-on-failure'` | `'only-on-failure'` |
| `video` | `'off'`, `'on'`, `'retain-on-failure'`, `'on-first-retry'` | `'retain-on-failure'` |
| `trace` | `'off'`, `'on'`, `'retain-on-failure'`, `'on-first-retry'`, `'on-all-retries'`, `'retain-on-first-failure'` | `'retain-on-failure'` locally, `'on-first-retry'` in CI |

- **`retain-on-failure`**: records every test, deletes the file when it passes. Always have evidence of a failure, but recording costs a little time.
- **`on-first-retry`**: records only when a test is retried. Cheap, but you get nothing if there are no retries.
- **Screenshot** = the page at the end of the test. **Video** = the whole test as a movie. **Trace** = everything (see §16). A trace is almost always the most useful.

**Code.**
```ts
use: {
  trace: 'retain-on-failure',
  screenshot: { mode: 'only-on-failure', fullPage: true },
  video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } },
},
```
Per project or per file:
```ts
test.use({ video: 'on' }); // e.g. to record a demo of one flow
```

**🧩 In this project:** the `use` block in [playwright.config.ts](playwright.config.ts) (`trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`). Files land in `reports/test-results/`.

---

## 16. The Trace Viewer

**Theory.** A trace is a zip with, for **every action**: a DOM snapshot before/after (that you can inspect like DevTools), the locator used, the network requests, console messages, the source line and timing. It answers "what did the page look like when the click failed?" without re-running the test.

**Code.**
```bash
# From the HTML report: open a failed test → "Traces" → click the trace
npm run report

# Directly:
npx playwright show-trace reports/test-results/<test-folder>/trace.zip

# Always record (e.g. while debugging one test):
npx playwright test tests/auddia/add-track.ui.spec.ts --trace on
```
Online viewer (file stays in your browser): https://trace.playwright.dev

How to read it:
1. **Actions list** (left): every click/fill/expect. Red = failed.
2. **Before / Action / After** tabs: the DOM at that moment. The red dot shows where Playwright clicked.
3. **Locator** picker: test a locator against the snapshot.
4. **Network / Console / Source** tabs below.

**🧩 In this project:** every `@step` method shows up in the trace actions list as a group (see §17).

---

## 17. Steps (test.step and @step)

**Theory.** Without steps, the report shows a flat list of 40 low-level actions. With steps it shows a **tree of business actions**: "Fill basics" → "Select genre" → "Create artist", each with its own duration and with the failure inside the right step. `box: true` makes an error point at the **step call in the test**, not at a line deep inside the page object.

**Code.**
```ts
// In a test
await test.step('Applicant fills personal details', async () => {
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByLabel('PAN').fill('ABCDE1234F');
});

// A step can return a value
const id = await test.step('Submit application', async () => {
  await page.getByRole('button', { name: 'Submit' }).click();
  return page.url().split('/').pop()!;
});

// Options
await test.step('Upload KYC', async () => { /* ... */ }, { box: true, timeout: 15_000 });
```

**🧩 In this project:** [src/core/utils/step.decorator.ts](src/core/utils/step.decorator.ts) is a decorator that wraps a method in `test.step(..., { box: true })` named `ClassName.method`. It's used on every action in [src/pages/auddia/AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts), so the report for `add-track.ui.spec.ts` shows `AuddiaAddTrackPage.goToReview` → `fillUpload` → `uploadAudio`, and so on.

---

## 18. Attachments (testInfo.attach)

**Theory.** Your own evidence in the report: a screenshot at an important moment, the JSON sent to an API, a generated PDF, a CSV export. Each attachment has a **name**, a **content type** (so the report knows how to show it) and either a `body` (in memory) or a `path` (file on disk).

| contentType | Shown as |
|---|---|
| `image/png`, `image/jpeg` | Image |
| `application/json`, `text/plain` | Text you can read and copy |
| `text/html` | Link that opens the page |
| `application/pdf`, `text/csv`, others | Download link |

**Code.**
```ts
test('approved loan has a sanction letter', async ({ page }, testInfo) => {
  // 1. Screenshot at a chosen moment
  await testInfo.attach('application summary', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  // 2. Data as JSON
  await testInfo.attach('application data', {
    body: JSON.stringify({ amount: 500000, tenure: 36, rate: 10.5 }, null, 2),
    contentType: 'application/json',
  });

  // 3. A downloaded file
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download sanction letter' }).click(),
  ]);
  const file = testInfo.outputPath('sanction-letter.pdf'); // inside this test's output folder
  await download.saveAs(file);
  await testInfo.attach('sanction letter', { path: file, contentType: 'application/pdf' });
});

// Outside the test function (page object, helper): use test.info()
import { test } from '@playwright/test';
await test.info().attach('note', { body: 'some text', contentType: 'text/plain' });
```

> `test.info()` throws when called outside a running test (e.g. in a worker fixture). Wrap it in `try/catch` in shared code.

**🧩 In this project:**
- [src/core/ui/BasePage.ts](src/core/ui/BasePage.ts) has `attachScreenshot(name)`, so any page object can call `await loginPage.attachScreenshot('after login')`.
- [src/core/api/ApiClient.ts](src/core/api/ApiClient.ts) attaches **every API call** (`POST /employees → 201`) with the request body, response body and duration. That's why API tests have such readable reports. It wraps `test.info()` in `try/catch`, as the note above says.

---

## 19. Annotations (issue links, notes)

**Theory.** Annotations are **labels with a type and a description** shown at the top of the test in the HTML report. `test.skip`, `test.fail`, `test.fixme` and `test.slow` add them automatically. Add your own for bug links, requirement IDs and notes such as "created artist 294084".

**Code.**
```ts
// Static: known before the test runs
test(
  'EMI is shown on the offer page',
  { annotation: [{ type: 'issue', description: 'https://jira.company.com/browse/LOAN-412' },
                 { type: 'requirement', description: 'REQ-EMI-01' }] },
  async ({ page }) => { /* ... */ },
);

// Dynamic: known only while running
test('creates an application', async ({ page }) => {
  const id = '2026-000123';
  test.info().annotations.push({ type: 'application id', description: id });
});

// Conditional skip, shown as an annotation with the reason
test('PDF export', async ({ browserName }) => {
  test.skip(browserName === 'firefox', 'PDF viewer differs in Firefox');
});
```

**🧩 Idea for this project:** in [tests/auddia/add-track.ui.spec.ts](tests/auddia/add-track.ui.spec.ts), after `artistId = await addArtistPage.createArtist()` you could add `test.info().annotations.push({ type: 'artist id', description: artistId })`. The report would then show which staging artist each run created, which helps because the UI can't delete them.

---

## 20. Tags in the report

**Theory.** Tags (`@smoke`, `@regression`) appear as coloured chips in the HTML report, and you can **filter** by them in the search box (`@smoke`, `@smoke @negative`, `!@negative`, `p:ui` for a project, `s:failed` for a status). The `json` reporter lists them in `tags`.

**Code.**
```ts
test('login', { tag: ['@smoke', '@auth'] }, async ({ page }) => { /* ... */ });
test.describe('loan offers', { tag: '@regression' }, () => { /* ... */ });
```
HTML report search examples:
```
@smoke              tests tagged smoke
@smoke s:failed     failed smoke tests
p:auddia            only the auddia project
```

**🧩 In this project:** all tags come from [src/config/tags.ts](src/config/tags.ts) (`Tag.smoke`, `Tag.tracks`…) so there are no typos, e.g. `{ tag: [Tag.tracks, Tag.regression] }` in [tests/auddia/add-track.ui.spec.ts](tests/auddia/add-track.ui.spec.ts).

---

## 21. Console output and logs

**Theory.** Anything a test prints (`console.log`, your logger) is captured **per test** as **stdout/stderr** and shown in the HTML report under that test, so logs from parallel tests don't get mixed. The browser's console is **not** captured automatically; listen to it yourself if you need it.

**Code.**
```ts
// Capture the browser console + page errors into the report
test.beforeEach(async ({ page }, testInfo) => {
  const lines: string[] = [];
  page.on('console', (msg) => lines.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => lines.push(`[pageerror] ${err.message}`));

  // Runs after each test: attach only when something was logged
  testInfo.attachments; // (just to show testInfo is available here)
  test.info().annotations; //
  afterEachLogs = lines;
});
let afterEachLogs: string[] = [];
test.afterEach(async ({}, testInfo) => {
  if (afterEachLogs.length) {
    await testInfo.attach('browser console', { body: afterEachLogs.join('\n'), contentType: 'text/plain' });
  }
});
```
Cleaner as an **auto fixture** (runs for every test, no hooks needed):
```ts
export const test = base.extend<{ _browserConsole: void }>({
  _browserConsole: [
    async ({ page }, use, testInfo) => {
      const lines: string[] = [];
      page.on('console', (m) => lines.push(`[${m.type()}] ${m.text()}`));
      page.on('pageerror', (e) => lines.push(`[pageerror] ${e.message}`));
      await use();
      if (testInfo.status !== testInfo.expectedStatus && lines.length) {
        await testInfo.attach('browser console', { body: lines.join('\n'), contentType: 'text/plain' });
      }
    },
    { auto: true },
  ],
});
```

**🧩 In this project:** `_testLogger` in [src/fixtures/base.fixture.ts](src/fixtures/base.fixture.ts) is the same auto-fixture pattern. It logs `▶ START` / `✔ PASSED` for every test, and that output shows up in each test's stdout in the report.

---

## 22. Masking secrets and personal data

**Theory.** Reports get shared (Slack, CI artifacts, e-mail). Anything you attach, any screenshot and any trace can leak **passwords, tokens and personal data**. Traces contain the full network traffic, including `Authorization` headers and request bodies. Rules:
1. Mask before attaching (replace values with `***`).
2. Use **test data**, never real customer data.
3. Use `mask` on screenshots to black out sensitive fields.
4. Keep the reports from shared environments private (CI artifacts with limited access and retention).

**Code.**
```ts
// Mask fields in a screenshot
await expect(page).toHaveScreenshot('profile.png', {
  mask: [page.getByLabel('PAN'), page.getByLabel('Aadhaar')],
});
await page.screenshot({ path: 'x.png', mask: [page.getByTestId('account-number')] });

// Mask values before attaching
function mask(obj: Record<string, unknown>, keys = ['password', 'token', 'pan', 'aadhaar', 'accountNumber']) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, keys.includes(k) ? '***' : v]));
}
await test.info().attach('request', { body: JSON.stringify(mask(payload), null, 2), contentType: 'application/json' });
```

**🧩 In this project:** `maskSecrets()` in [src/core/api/ApiClient.ts](src/core/api/ApiClient.ts) replaces password/token/secret values before every API attachment.

---

# Part D – Beyond the built-ins

## 23. Writing a custom reporter

**Theory.** A custom reporter is a **class that implements the `Reporter` interface**. Playwright calls its methods in this order:

```
onBegin(config, suite)            once – suite = tree of all tests that will run
  onTestBegin(test, result)       per test attempt
    onStepBegin / onStepEnd       per step (test.step, expect, actions)
    onStdOut / onStdErr           when the test prints
  onTestEnd(test, result)         per test attempt – result.status, duration, errors, attachments
onError(error)                    errors outside tests
onEnd(result)                     once – result.status = 'passed' | 'failed' | 'timedout' | 'interrupted'
onExit()                          last chance before the process ends
```

Use it for: a short summary file, a Slack/Teams message, pushing results to a test management tool (TestRail, Xray, Zephyr), counting slow tests…

`test.outcome()` gives `expected` / `unexpected` / `flaky` / `skipped` (see §2). `test.titlePath()` gives `['', 'ui', 'file.spec.ts', 'describe', 'test']`.

**Code.** `reporters/summary-reporter.ts`
```ts
import type {
  FullConfig, FullResult, Reporter, Suite, TestCase, TestResult,
} from '@playwright/test/reporter';
import fs from 'fs';

class SummaryReporter implements Reporter {
  private passed = 0;
  private failed: string[] = [];
  private flaky: string[] = [];
  private skipped = 0;
  private start = Date.now();

  // Options come from the config: ['./reporters/summary-reporter.ts', { outputFile: '...' }]
  constructor(private options: { outputFile?: string } = {}) {}

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Running ${suite.allTests().length} tests with ${config.workers} workers`);
  }

  // Called once per ATTEMPT; with retries a test can arrive here more than once
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.retry < test.retries && result.status === 'failed') return; // will be retried – wait
    const name = test.titlePath().filter(Boolean).join(' › ');
    switch (test.outcome()) {
      case 'expected': this.passed++; break;
      case 'flaky': this.flaky.push(name); break;
      case 'skipped': this.skipped++; break;
      case 'unexpected': this.failed.push(`${name}\n    ${result.error?.message?.split('\n')[0] ?? ''}`); break;
    }
  }

  onEnd(result: FullResult) {
    const seconds = Math.round((Date.now() - this.start) / 1000);
    const text = [
      `Result: ${result.status.toUpperCase()} in ${seconds}s`,
      `Passed: ${this.passed}  Failed: ${this.failed.length}  Flaky: ${this.flaky.length}  Skipped: ${this.skipped}`,
      ...(this.failed.length ? ['', 'FAILED:', ...this.failed.map((f) => `  ✖ ${f}`)] : []),
      ...(this.flaky.length ? ['', 'FLAKY:', ...this.flaky.map((f) => `  ± ${f}`)] : []),
    ].join('\n');

    if (this.options.outputFile) fs.writeFileSync(this.options.outputFile, text);
    console.log('\n' + text);
  }

  // false = this reporter does not replace list/line in the terminal
  printsToStdio() {
    return false;
  }
}

export default SummaryReporter;
```
Register it:
```ts
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['./reporters/summary-reporter.ts', { outputFile: 'reports/summary.txt' }],
],
```

> The reporter runs in the **main process**, not in the workers. It can't use `page`, but it can read files, call APIs and write anything.

---

## 24. Custom reporter: summary file + Slack/Teams message

**Theory.** Teams usually want **one message after the nightly run**: counts, failed tests and a link to the report. Do it in `onEnd` with `fetch` (built into Node 18+). Keep the webhook URL in an **env var** (dotenv), never in code. `onEnd` may be `async`; Playwright waits for it.

**Code.**
```ts
// inside SummaryReporter (§23)
async onEnd(result: FullResult) {
  const webhook = process.env.SLACK_WEBHOOK_URL; // or TEAMS_WEBHOOK_URL
  if (!webhook) return; // locally: do nothing

  const icon = result.status === 'passed' ? ':white_check_mark:' : ':x:';
  const reportUrl = process.env.REPORT_URL ?? ''; // e.g. the GitHub Pages / CI artifact link
  const text =
    `${icon} *Loan app regression* – ${result.status}\n` +
    `Passed ${this.passed} · Failed ${this.failed.length} · Flaky ${this.flaky.length} · Skipped ${this.skipped}\n` +
    (this.failed.length ? `Failed:\n${this.failed.slice(0, 10).map((f) => `• ${f.split('\n')[0]}`).join('\n')}\n` : '') +
    (reportUrl ? `<${reportUrl}|Open report>` : '');

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }), // Teams incoming webhooks also accept { text }
    });
  } catch (e) {
    console.error('Could not send Slack message', e); // never fail the run because of the message
  }
}
```

---

## 25. Reading results.json with a script

**Theory.** If you only need numbers **after** the run (quality gate, dashboard, e-mail), you don't need a custom reporter. Read the `json` reporter's file in a small script and run it as a separate CI step.

**Code.** `scripts/check-results.ts` (run with `npx tsx scripts/check-results.ts`, or write it as `.mjs` for plain `node`)
```ts
import fs from 'fs';

type Result = { status: string; duration: number };
type Spec = { title: string; tags: string[]; tests: { projectName: string; results: Result[] }[] };
type SuiteNode = { title: string; specs: Spec[]; suites?: SuiteNode[] };

const report = JSON.parse(fs.readFileSync('reports/json/results.json', 'utf8'));
const { expected, unexpected, flaky, skipped, duration } = report.stats;
console.log(`passed ${expected}, failed ${unexpected}, flaky ${flaky}, skipped ${skipped}, ${Math.round(duration / 1000)}s`);

// Walk the tree and list the 5 slowest tests
const all: { name: string; ms: number }[] = [];
const walk = (s: SuiteNode, path: string[]) => {
  for (const spec of s.specs) {
    for (const t of spec.tests) {
      const last = t.results.at(-1);
      if (last) all.push({ name: [...path, spec.title].join(' › '), ms: last.duration });
    }
  }
  s.suites?.forEach((child) => walk(child, [...path, child.title]));
};
report.suites.forEach((s: SuiteNode) => walk(s, [s.title]));
all.sort((a, b) => b.ms - a.ms).slice(0, 5).forEach((t) => console.log(`${t.ms} ms  ${t.name}`));

// Quality gate: fail the CI step when too many tests are flaky
if (flaky > 3) {
  console.error(`Too many flaky tests: ${flaky}`);
  process.exit(1);
}
```

**🧩 In this project:** the input file is `reports/json/results.json`, written by the `json` reporter in [playwright.config.ts](playwright.config.ts).

---

## 26. Allure report

**Theory.** Allure is a popular **third-party report** with history and trends across runs, categories of failures, and grouping by feature/story/severity (good for managers and QA leads). It works in two stages:
1. During the run, the `allure-playwright` reporter writes raw result files into `allure-results/`.
2. After the run, the Allure CLI turns them into a website. Allure 2's CLI needs **Java**; Allure 3 is pure Node.

Keep the built-in `html` reporter as well. Its trace viewer is better for debugging.

**Code.**
```bash
npm i -D allure-playwright allure-commandline     # allure-commandline = Allure 2 (needs Java)
```
```ts
reporter: [
  ['list'],
  ['html', { open: 'never' }],
  ['allure-playwright', { resultsDir: 'reports/allure-results' }],
],
```
```ts
// Optional extra labels in a test
import * as allure from 'allure-js-commons';

test('EMI calculation', async ({ page }) => {
  await allure.epic('Loan origination');
  await allure.feature('Offer');
  await allure.severity('critical');
  await allure.issue('LOAN-412', 'https://jira.company.com/browse/LOAN-412');
  // test.step and testInfo.attach also appear in Allure automatically
});
```
```bash
npx allure generate reports/allure-results --clean -o reports/allure-report
npx allure open reports/allure-report
# or both in one go:
npx allure serve reports/allure-results
```
> **History/trends:** copy `allure-report/history` into the next run's `allure-results/history` before generating. CI plugins (Jenkins Allure plugin, `simple-elf/allure-report-action` on GitHub) do this for you.

---

## 27. Monocart report

**Theory.** `monocart-reporter` is a single-page HTML report with a **grid view**: sortable columns, duration charts, and code coverage if you collect it. A good choice if you want something nicer than the built-in report without Allure's Java/history setup.

**Code.**
```bash
npm i -D monocart-reporter
```
```ts
reporter: [
  ['list'],
  ['monocart-reporter', { name: 'Loan app report', outputFile: './reports/monocart/index.html' }],
],
```
```bash
npx monocart show-report reports/monocart/index.html
```

---

# Part E – CI

## 28. Sharding and merging reports

**Theory.** **Sharding** splits the suite across machines: `--shard=1/4` runs the first quarter of the tests, and so on. Each machine would normally make its own, partial HTML report. That's not useful, so instead:
1. Each shard writes a **blob** report (§10).
2. A final CI job downloads all blobs into one folder.
3. `merge-reports` replays them through normal reporters → **one** HTML/JUnit report for the whole run.

**Code.**
```bash
# On each machine (N = 1..4)
BLOB_REPORT=1 npx playwright test --shard=N/4
#   → reports/blob/report-<hash>.zip  (with this project's config)

# In the final job, after collecting every zip into ./all-blob-reports
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
#   → reports/html and reports/junit/results.xml for the whole run

# Without a config file, choose reporters directly
npx playwright merge-reports --reporter html,junit ./all-blob-reports
```

**🧩 In this project:** the `BLOB_REPORT` switch in [playwright.config.ts](playwright.config.ts) and the reporters for the merge in [merge.config.ts](merge.config.ts).

---

## 29. GitHub Actions: upload and publish the report

**Theory.** A CI machine is deleted after the job, so the report has to be **uploaded as an artifact** (downloadable zip) or **published** (e.g. GitHub Pages) to survive. Use `if: ${{ !cancelled() }}` so the report is uploaded **even when tests fail**. That's exactly when you need it.

**Code.** `.github/workflows/playwright.yml` (simple, one machine)
```yaml
name: Playwright
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          CI: true
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: reports/html
          retention-days: 14
```
Sharded version (4 machines + merge job):
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { shard: [1, 2, 3, 4] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npx playwright test --shard=${{ matrix.shard }}/4
        env: { CI: true, BLOB_REPORT: 1 }
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: blob-${{ matrix.shard }}, path: reports/blob, retention-days: 1 }

  merge:
    needs: test
    if: ${{ !cancelled() }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with: { path: all-blob-reports, pattern: blob-*, merge-multiple: true }
      - run: npx playwright merge-reports --config merge.config.ts ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with: { name: playwright-report, path: reports/html, retention-days: 14 }
```
To view: open the workflow run → **Artifacts** → download `playwright-report` → unzip → `npx playwright show-report <folder>`.

---

## 30. Jenkins / Azure DevOps / GitLab with JUnit

**Theory.** These tools display results from **JUnit XML** natively. Point them at `reports/junit/results.xml` and archive `reports/html` as a build artifact for the full Playwright report.

**Code.**

Jenkins (`Jenkinsfile`):
```groovy
pipeline {
  agent { docker { image 'mcr.microsoft.com/playwright:v1.63.0-noble' } } // match your @playwright/test version
  stages {
    stage('Install') { steps { sh 'npm ci' } }
    stage('Test')    { steps { sh 'CI=true npx playwright test' } }
  }
  post {
    always {
      junit 'reports/junit/results.xml'                       // "Test Result" tab + trend graph
      archiveArtifacts artifacts: 'reports/html/**', allowEmptyArchive: true
      // With the HTML Publisher plugin:
      // publishHTML([reportDir: 'reports/html', reportFiles: 'index.html', reportName: 'Playwright'])
    }
  }
}
```

Azure DevOps (`azure-pipelines.yml`):
```yaml
- script: npx playwright test
  env: { CI: 'true' }
- task: PublishTestResults@2
  condition: succeededOrFailed()
  inputs: { testResultsFormat: JUnit, testResultsFiles: reports/junit/results.xml }
- task: PublishPipelineArtifact@1
  condition: succeededOrFailed()
  inputs: { targetPath: reports/html, artifact: playwright-report }
```

GitLab (`.gitlab-ci.yml`):
```yaml
e2e:
  image: mcr.microsoft.com/playwright:v1.63.0-noble
  script: [npm ci, npx playwright test]
  artifacts:
    when: always
    paths: [reports/html]
    reports: { junit: reports/junit/results.xml } # shows in the merge request
    expire_in: 2 weeks
```

---

# Part F – Practical

## 31. Reports for the loan application (audit evidence)

**Theory.** For an internal lending app, the report is more than a pass/fail list. QA leads, product owners and sometimes **audit/compliance** ask "show me proof that the maker–checker rule and the EMI calculation were tested on this release". Plan the report for that:

| Need | How |
|---|---|
| Link a test to a requirement or Jira ticket | `annotation: { type: 'requirement', description: 'REQ-…' }` (§19) |
| Proof of what was checked | `test.step` with business names (§17): "Checker approves application" |
| Proof of the data used | Attach the masked application JSON (§18, §22) |
| Proof of documents | Attach the downloaded sanction letter PDF / CSV export (§18) |
| Which records were created on the shared environment | Dynamic annotation with the application id (§19) |
| Group by module | Tags `@origination`, `@kyc`, `@disbursal` + `describe` per module (§20) |
| Release sign-off | Keep the HTML report of the release run as a CI artifact (§29) and send the summary (§24) |
| No personal data in reports | Faker / factory data only, `mask` on screenshots, keep artifacts private (§22) |

**Code.** One test that uses all of them:
```ts
import { test, expect } from '@playwright/test';

test(
  'checker approves an application created by a maker',
  {
    tag: ['@workflow', '@critical'],
    annotation: [
      { type: 'requirement', description: 'REQ-WF-07 maker cannot approve own application' },
      { type: 'issue', description: 'https://jira.company.com/browse/LOAN-512' },
    ],
  },
  async ({ browser }, testInfo) => {
    const maker = await browser.newPage({ storageState: '.auth/maker.json' });
    const checker = await browser.newPage({ storageState: '.auth/checker.json' });

    const appId = await test.step('Maker submits application', async () => {
      await maker.goto('/applications/new');
      // ... fill the wizard ...
      await maker.getByRole('button', { name: 'Submit' }).click();
      return (await maker.getByTestId('application-id').textContent())!.trim();
    });
    testInfo.annotations.push({ type: 'application id', description: appId });

    await test.step('Maker cannot approve own application', async () => {
      await maker.goto(`/applications/${appId}`);
      await expect(maker.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    });

    await test.step('Checker approves', async () => {
      await checker.goto(`/applications/${appId}`);
      await checker.getByRole('button', { name: 'Approve' }).click();
      await expect(checker.getByText('Status: Approved')).toBeVisible();
      await testInfo.attach('approved application', {
        body: await checker.screenshot({ fullPage: true, mask: [checker.getByLabel('PAN')] }),
        contentType: 'image/png',
      });
    });
  },
);
```

---

## 32. Troubleshooting

| Problem | Cause → Fix |
|---|---|
| `npm run report` says no report found | The run used `--reporter=list`, or a different folder → run `npx playwright test` without `--reporter`, or pass the right folder to `show-report` |
| CI job hangs at the end | `html` reporter with `open: 'always'`/`'on-failure'` → set `open: 'never'` |
| Trace won't open from the HTML file | Opened via `file://` → use `npx playwright show-report` (serves over http) or https://trace.playwright.dev |
| Screenshots/traces from the last run are gone | `outputDir` is emptied at the start of every run → copy or upload them before the next run |
| No trace for a failed test in CI | `trace: 'on-first-retry'` but `retries: 0` → use `retain-on-failure` or enable retries |
| HTML report is huge | Videos/traces for every test (`'on'`) → use `retain-on-failure` |
| Report shows only part of the tests in CI | Sharding without merging → blob + `merge-reports` (§28) |
| `test.info()` throws "can only be called while test is running" | Called in a worker fixture or at import time → `try/catch` (as in `ApiClient.attach`) |
| JUnit messages full of `[31m` codes | Colour codes → `stripANSIControlSequences: true` |
| Same test name in several projects is confusing in CI | `includeProjectInTestName: true` on `junit` |
| Custom reporter prints nothing | Its `printsToStdio()` returns `true` and replaces the terminal reporter, or it isn't listed in `reporter` → check the config and the path |

---

## 33. Quick reference

```bash
npx playwright test                                  # all reporters from the config
npx playwright test --reporter=dot                   # override reporters
npx playwright test --reporter=list,html
npx playwright test --trace on                       # record a trace for every test
npx playwright show-report reports/html              # open HTML report  (= npm run report)
npx playwright show-trace path/to/trace.zip          # open one trace
BLOB_REPORT=1 npx playwright test --shard=1/4        # shard + blob (this project)
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
REPORT_DIR=build/reports npx playwright test         # move all reports (this project)
```

```ts
// Config
reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }],
           ['junit', { outputFile: 'reports/junit/results.xml' }], ['json', { outputFile: 'reports/json/results.json' }]],
use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },

// In tests
await test.step('Business step', async () => { /* ... */ });
await testInfo.attach('name', { body, contentType: 'application/json' });   // or { path, contentType }
testInfo.annotations.push({ type: 'application id', description: id });
test('t', { tag: '@smoke', annotation: { type: 'issue', description: url } }, async () => {});
test.skip(cond, 'reason'); test.fail(); test.fixme(); test.slow();
```

| Want | Use |
|---|---|
| See progress locally | `list` |
| Huge suite in CI logs | `line` or `dot` |
| Debug a failure | `html` + trace (§16) |
| CI test tab / trends | `junit` |
| Script / dashboard / gate | `json` (§25) |
| Split across machines | `blob` + `merge-reports` |
| PR annotations | `github` |
| Manager-friendly history | Allure (§26) |
| Team message after run | Custom reporter (§24) |
