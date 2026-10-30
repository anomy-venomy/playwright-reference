# Playwright Locators – Theory

The **why** behind [LOCATORS_CHEATSHEET.md](LOCATORS_CHEATSHEET.md).
Each topic explains the idea in plain words, then points to:

- 📄 **Cheat sheet** – the copy-paste snippet for it
- 🧩 **In this project** – real code that uses it (open the file and read along)

Read Part A once from top to bottom – everything else builds on it. Use the rest as a dictionary.

## Contents

**Part A – Core ideas (read first)**
1. [What a locator really is](#1-what-a-locator-really-is)
2. [Auto-waiting and actionability](#2-auto-waiting-and-actionability)
3. [The accessibility tree: roles and accessible names](#3-the-accessibility-tree-roles-and-accessible-names)
4. [Why the locator priority order exists](#4-why-the-locator-priority-order-exists)
5. [Strict mode](#5-strict-mode)
6. [Filtering, chaining and scoping](#6-filtering-chaining-and-scoping)
7. [Web-first assertions (auto-retrying expect)](#7-web-first-assertions-auto-retrying-expect)
8. [Timeouts – which one fires when](#8-timeouts--which-one-fires-when)

**Part B – Interacting with elements**
9. [`fill()` vs `pressSequentially()` – and browser events](#9-fill-vs-presssequentially--and-browser-events)
10. [Validation: on blur, on submit, and browser built-in](#10-validation-on-blur-on-submit-and-browser-built-in)
11. [Native controls vs custom (JS) controls](#11-native-controls-vs-custom-js-controls)
12. [Clicks, hover and the mouse](#12-clicks-hover-and-the-mouse)
13. [Keyboard and focus](#13-keyboard-and-focus)
14. [Files: upload and download](#14-files-upload-and-download)

**Part C – Events, pages, network**
15. [Events and the "start waiting before you click" rule](#15-events-and-the-start-waiting-before-you-click-rule)
16. [Native dialogs vs HTML modals](#16-native-dialogs-vs-html-modals)
17. [Browser, context, page – tabs, popups, multiple users](#17-browser-context-page--tabs-popups-multiple-users)
18. [iframes](#18-iframes)
19. [Network: waiting for, mocking and blocking requests](#19-network-waiting-for-mocking-and-blocking-requests)
20. [Controlling time with `page.clock`](#20-controlling-time-with-pageclock)

**Part D – Framework ideas**
21. [Page Object Model](#21-page-object-model)
22. [Fixtures](#22-fixtures)
23. [The `@step` decorator and `test.step`](#23-the-step-decorator-and-teststep)
24. [Sessions: `storageState` and the setup project](#24-sessions-storagestate-and-the-setup-project)
25. [Config and secrets with dotenv](#25-config-and-secrets-with-dotenv)
26. [Serial vs parallel tests](#26-serial-vs-parallel-tests)
27. [Test data: unique, realistic, cleaned up](#27-test-data-unique-realistic-cleaned-up)
28. [Hybrid tests: API for setup, UI for the check](#28-hybrid-tests-api-for-setup-ui-for-the-check)

**Part E – Test design theory**
29. [Equivalence partitioning and boundary values](#29-equivalence-partitioning-and-boundary-values)
30. [Data-driven tests](#30-data-driven-tests)
31. [Positive, negative and edge cases](#31-positive-negative-and-edge-cases)
32. [Why tests are flaky – and the cures](#32-why-tests-are-flaky--and-the-cures)

**Part F – Loan application theory**
33. [EMI and the reducing-balance formula](#33-emi-and-the-reducing-balance-formula)
34. [Amortization schedule](#34-amortization-schedule)
35. [Floating-point money and rounding](#35-floating-point-money-and-rounding)
36. [Eligibility rules and DTI](#36-eligibility-rules-and-dti)
37. [Workflows as state machines](#37-workflows-as-state-machines)
38. [Maker–checker (four-eyes principle)](#38-makerchecker-four-eyes-principle)
39. [Roles and access control (RBAC)](#39-roles-and-access-control-rbac)
40. [PII: masking and where data must never appear](#40-pii-masking-and-where-data-must-never-appear)
41. [Double submit and concurrent edits](#41-double-submit-and-concurrent-edits)
42. [Audit trail](#42-audit-trail)

[Glossary](#glossary)

---

# Part A – Core ideas

## 1. What a locator really is

A **locator is a recipe for finding an element, not the element itself.**

```ts
const save = page.getByRole('button', { name: 'Save' }); // nothing happens yet – no search
await save.click();                                       // NOW Playwright searches, waits, clicks
await save.click();                                       // searches AGAIN – always fresh
```

Why that matters:

- You can create locators in a page-object **constructor**, before the page has even loaded. They only search when used.
- React/Angular re-render and replace elements all the time. Because a locator searches again on every use, you never get the Selenium-style "stale element" error.
- Creating a locator never fails. It only fails when you **act** on it or **assert** on it and nothing matches in time.

`Locator` vs `ElementHandle`: old code uses `page.$('...')`, which returns a handle to one specific element at one moment (can go stale). Prefer locators everywhere.

📄 Cheat sheet: [§1 Locator priority](LOCATORS_CHEATSHEET.md#1-locator-priority--which-one-to-use)
🧩 In this project: every page object constructor, e.g. [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) – all locators are created up front, used later.

## 2. Auto-waiting and actionability

Before every action, Playwright waits until the element is **actionable**. For `click()` that means the element is:

| Check | Meaning |
|---|---|
| attached | exists in the DOM |
| visible | has a size and isn't `display:none` / `visibility:hidden` |
| stable | not moving (animations finished) |
| receives events | not covered by another element (overlay, spinner, open dropdown) |
| enabled | not `disabled` |

`fill()` additionally waits for the element to be **editable**. If the checks don't pass before `actionTimeout`, the action fails with a log showing which check was failing ("element is not enabled", "another element would receive the click"…).

This is why **you never need `waitForTimeout()`** – the wait is built in. A hard sleep is either too short (flaky) or too long (slow).

`{ force: true }` skips these checks. It "fixes" a failing click by hiding the real problem (e.g. a modal covering the button that a user couldn't click either). Avoid it.

📄 Cheat sheet: [§12 Button click](LOCATORS_CHEATSHEET.md#12-button-click)
🧩 In this project: [BasePage.ts](src/core/ui/BasePage.ts) – the header comment says "no hard sleeps anywhere"; [eslint.config.mjs](eslint.config.mjs) bans `waitForTimeout` and warns on `force`.

## 3. The accessibility tree: roles and accessible names

Browsers build an **accessibility tree** next to the DOM – the simplified view a screen reader uses. Every element gets:

- a **role** – what it is: `button`, `link`, `textbox`, `checkbox`, `combobox`, `option`, `dialog`, `heading`, `row`, `slider`…
- an **accessible name** – what it's called: the text a screen reader would read.

Where roles come from:

- **Implicit** from the HTML tag: `<button>` → `button`, `<a href>` → `link`, `<input type="checkbox">` → `checkbox`, `<input type="number">` → `spinbutton`, `<select>` → `combobox`, `<h1>`–`<h6>` → `heading`.
- **Explicit** from `role="..."` on custom elements: `<div role="dialog">`, `<li role="option">`.

Where the accessible name comes from (in order): `aria-labelledby` → `aria-label` → the `<label>` linked to the input → the element's own text → `title` / `placeholder`.

```html
<label for="email">Email address</label><input id="email">   → textbox "Email address"
<button aria-label="Close">×</button>                         → button "Close"
<button>Save <svg/></button>                                  → button "Save"
```

`getByRole('textbox', { name: 'Email address' })` searches this tree. To see what the tree looks like for a page:

```ts
console.log(await page.locator('main').ariaSnapshot());
```

That's exactly how the Auddia pages were explored before writing their page objects – the snapshot showed `combobox "State/Province"`, `button "Next" [disabled]` and so on.

📄 Cheat sheet: [§1](LOCATORS_CHEATSHEET.md#1-locator-priority--which-one-to-use), [§35 Debugging](LOCATORS_CHEATSHEET.md#35-debugging-tips)
🧩 In this project: [AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts) – almost everything is `getByRole`.

## 4. Why the locator priority order exists

The order `getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS` goes from **"how a user sees the page"** to **"how the code is written"**.

- A user finds "the **Save** button", not "`div.btn-primary:nth-child(3)`". Role + name survives redesigns, CSS refactors and framework changes.
- If `getByRole` can't find something, real users with screen readers probably can't either – the test is quietly reporting an accessibility bug.
- `data-testid` is stable but invisible to users; it's the fallback when there's no meaningful role/label/text (icons, charts, repeated widgets).
- CSS/XPath depend on structure and break on every refactor. Use them only for things with no role at all – like a hidden `input[type="file"]`.

🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) uses `page.locator('input[type="file"]')` – the one place CSS is the right choice, because the input is hidden behind a "Click to upload" box.

## 5. Strict mode

If a locator matches **more than one** element when you act on it, Playwright refuses and throws a **strict mode violation**. It won't guess which one you meant – guessing is how tests click the wrong thing and still pass.

Typical causes and fixes:

| Cause | Fix |
|---|---|
| Label text is a substring of another name ("Password" vs "Show Password") | `{ exact: true }` |
| Label matches the input **and** a button next to it | use the role: `getByRole('combobox', { name: ... })` |
| Same button in many rows | scope it: `row.getByRole('button', { name: 'Edit' })` |
| Text appears twice (heading + breadcrumb) | `filter()`, scope to a parent, or as a last resort `.first()` |

Assertions like `toHaveCount()` and methods like `.count()` / `.all()` are allowed to match many – strictness applies to actions and single-element assertions.

📄 Cheat sheet: [§1](LOCATORS_CHEATSHEET.md#1-locator-priority--which-one-to-use), [§6 Password](LOCATORS_CHEATSHEET.md#6-password-input--showhide)
🧩 In this project:
- [LoginPage.ts](src/pages/auddia/LoginPage.ts) – `getByLabel('Password', { exact: true })` with a comment explaining the violation it avoids.
- [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) – `stateInput` uses `getByRole('combobox')` because `getByLabel('State/Province')` matched the input *and* its dropdown button.

## 6. Filtering, chaining and scoping

Locators can be narrowed step by step – each step searches **inside** the previous result:

```ts
page.getByRole('dialog').getByRole('button', { name: 'Confirm' });  // only the button inside the dialog
page.getByRole('row').filter({ hasText: 'Jane' });                  // rows that contain "Jane"
page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Edit' }) }); // rows that contain an Edit button
page.getByRole('listitem').nth(2);                                  // the third one (0-based)
```

- **Chaining** (`a.getByRole(...)`) = "inside a".
- **`filter({ hasText })`** = "keep only those containing this text" (substring, case-insensitive; use a regex for more control).
- **`filter({ has })`** = "keep only those containing this child element".
- **`and()` / `or()`** = both conditions / either one.
- **`first()`, `last()`, `nth()`** pick by position – fragile if order changes, so prefer filtering by content.

📄 Cheat sheet: [§1](LOCATORS_CHEATSHEET.md#1-locator-priority--which-one-to-use), [§25 Table](LOCATORS_CHEATSHEET.md#25-table)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) – `confirmDiscardButton` is scoped inside `discardDialog`; [Toast.ts](src/pages/auddia/components/Toast.ts) uses `root.filter({ hasText })`.

## 7. Web-first assertions (auto-retrying expect)

There are two kinds of `expect`:

```ts
await expect(locator).toBeVisible();      // web-first: RETRIES until true or timeout
expect(await locator.isVisible()).toBe(true); // plain: checks ONCE, right now
```

The page is always changing (requests in flight, animations, re-renders). A web-first assertion keeps re-checking for up to `expect.timeout` (10 s here), so it passes the moment the page is ready. The plain version takes one snapshot – if the page is 50 ms behind, the test fails. **This difference is the #1 cause of flaky tests.**

Rules of thumb:
- Asserting on the page → `await expect(locator)...` / `await expect(page)...`.
- Asserting on a value you already have (a number from your own calculation, an API field) → plain `expect(value)`.
- Need to retry something that isn't a locator (an API status, a parsed number)? → `expect.poll(async () => ...)`.
- `toHaveCount(n)` retries; `expect(await loc.count()).toBe(n)` doesn't.

📄 Cheat sheet: [§34 Assertions](LOCATORS_CHEATSHEET.md#34-assertions-quick-list), [§43 EMI](LOCATORS_CHEATSHEET.md#43-emi-calculator--repayment-schedule) (uses `expect.poll`)
🧩 In this project: [add-artist.ui.spec.ts](tests/auddia/add-artist.ui.spec.ts) – every check is `await expect(...)`.

## 8. Timeouts – which one fires when

| Timeout | Set in | Default here | Covers |
|---|---|---|---|
| test | `timeout` | 90 s | the whole test incl. hooks and fixtures |
| expect | `expect.timeout` | 10 s | how long one web-first assertion retries |
| action | `use.actionTimeout` | 15 s | one click / fill / check… |
| navigation | `use.navigationTimeout` | 30 s | `goto`, `waitForURL`, `reload` |

All live in one file so nobody hard-codes numbers. You can override one call when something is genuinely slow:

```ts
await expect(page.getByText('100%')).toBeVisible({ timeout: 30_000 }); // big file upload
```

🧩 In this project: [timeouts.ts](src/config/timeouts.ts), used by [playwright.config.ts](playwright.config.ts).

---

# Part B – Interacting with elements

## 9. `fill()` vs `pressSequentially()` – and browser events

When a user types, the browser fires events: `keydown` → `keypress` → `input` → `keyup` for **every character**, then `change` when the field loses focus.

- **`fill('abc')`** focuses the field, replaces its value in one go and fires a single `input` event. Fast, and right for 95% of fields.
- **`pressSequentially('abc')`** types key by key, firing all the key events for each character. Use it when the app reacts to individual keys:
  - autocomplete / type-ahead searches (the Auddia State field),
  - input masks that format as you type (phone, PAN, currency),
  - `type="number"` when you want to test that letters are ignored (`fill('abc')` throws there).
- **`press('Enter')`** sends one key (or a combo like `Control+A`).
- **`clear()`** empties the field. `BasePage.fill()` calls `clear()` then `fill()`.

📄 Cheat sheet: [§3 Text input](LOCATORS_CHEATSHEET.md#3-text-input), [§5 Number](LOCATORS_CHEATSHEET.md#5-number-input), [§15 Autocomplete](LOCATORS_CHEATSHEET.md#15-dropdown--custom--autocomplete), [§41 Masks](LOCATORS_CHEATSHEET.md#41-identity--masked-fields-pan-aadhaar-ssn-phone-ifsc)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) – `selectState()` uses `typeSlowly()` (which calls `pressSequentially`) because `fill()` didn't trigger the search.

## 10. Validation: on blur, on submit, and browser built-in

Forms validate at different moments:

- **On blur** – when you leave the field. Most modern forms. To trigger it: click the field, then click elsewhere (or `blur()`).
- **On change / as you type** – messages appear while typing.
- **On submit** – nothing shows until you press the submit button.
- **Disabled submit** – the button stays disabled while anything is invalid (Auddia's "Next").

There are also two *sources* of validation:

- **Custom (app) validation** – a message rendered in the page ("Invalid email address."). Assert with `getByText`.
- **Browser built-in (HTML5) validation** – from attributes like `required`, `type="email"`, `min`, `max`, `maxlength`, `pattern`. No text in the DOM – the browser shows a bubble. Read it with `el.validity` / `el.validationMessage` via `evaluate()`.

📄 Cheat sheet: [§7 Email](LOCATORS_CHEATSHEET.md#7-email-input--validator-function), [§33 Validation pattern](LOCATORS_CHEATSHEET.md#33-form-validation-pattern-data-driven)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) `touchRequiredFields()` (click in, click out); [EditProfilePage.ts](src/pages/auddia/EditProfilePage.ts) `clearAllFields()` clicks the heading so the last field validates.

## 11. Native controls vs custom (JS) controls

**Native** controls are real HTML elements the browser draws: `<select>`, `<input type="checkbox|radio|range|date|file">`. Playwright has dedicated methods for them: `selectOption`, `check`, `fill` on range/date, `setInputFiles`.

**Custom** controls are built from `div`/`ul`/`li` by a UI library (MUI, PrimeReact, Ant…) to look nicer. They only *look* like a select or a checkbox:

- `selectOption()` fails on them – there's no `<select>`. You must **click to open, then click the option**, just like a user.
- `check()` may fail on a styled checkbox – click its label instead.
- Good libraries add ARIA roles (`combobox`, `listbox`, `option`, `switch`, `slider`) so `getByRole` still works. Use `ariaSnapshot()` to find out.
- Open dropdown lists often **cover** other elements – press `Escape` to close them, or the next click fails the "receives events" check (section 2).

How to tell which one you have: inspect the element. `<select>` → native. `<div role="combobox">` / `<input role="combobox">` → custom.

📄 Cheat sheet: [§14 Native select](LOCATORS_CHEATSHEET.md#14-dropdown--native-select), [§15 Custom dropdown](LOCATORS_CHEATSHEET.md#15-dropdown--custom--autocomplete), [§16 Multi-select](LOCATORS_CHEATSHEET.md#16-multi-select), [§17 Slider](LOCATORS_CHEATSHEET.md#17-range-slider)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) `selectGenre()` and [AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts) `selectOption()` – open, click option, `Escape`.

## 12. Clicks, hover and the mouse

- `click()` = move the mouse to the element's center, press, release – after the actionability checks.
- `dblclick()`, `click({ button: 'right' })`, `click({ modifiers: ['Shift'] })` – variations.
- `hover()` = move the mouse over the element, firing `mouseenter`/`mouseover`. CSS `:hover` styles and JS tooltips/menus react to it. To hide them again, move the mouse away (`page.mouse.move(0, 0)`).
- `page.mouse` is the raw mouse (`move`, `down`, `up`, `wheel`) – used for custom sliders and drag-and-drop libraries that need real movement in several steps.
- `locator.boundingBox()` gives `{ x, y, width, height }` on screen – used to calculate "70% along the slider track".

📄 Cheat sheet: [§12 Click](LOCATORS_CHEATSHEET.md#12-button-click), [§13 Hover](LOCATORS_CHEATSHEET.md#13-hover--tooltip), [§17 Slider](LOCATORS_CHEATSHEET.md#17-range-slider), [§20 Drag and drop](LOCATORS_CHEATSHEET.md#20-drag-and-drop)

## 13. Keyboard and focus

- Only one element has **focus** at a time – it receives key presses. `Tab` moves focus to the next focusable element.
- `locator.press('Enter')` focuses that element first; `page.keyboard.press('Enter')` sends the key to whatever is focused now.
- `ControlOrMeta` = Ctrl on Windows/Linux, Cmd on Mac – one test works everywhere.
- `toBeFocused()` checks where focus is – used for tab-order (accessibility) tests.

📄 Cheat sheet: [§30 Keyboard](LOCATORS_CHEATSHEET.md#30-keyboard-shortcuts)

## 14. Files: upload and download

**Upload.** A file input (`<input type="file">`) is usually hidden behind a pretty "Click to upload" area. Playwright can't use the operating-system file dialog, so instead it **sets the files on the input directly** with `setInputFiles()` – this works even when the input is hidden. Three ways to give it a file:
- a path on disk (keep test files in `src/data/files`),
- an in-memory file `{ name, mimeType, buffer }` – handy for "wrong type" or "too big" tests without storing big files,
- via the `filechooser` event, when the input only appears after clicking.

The app usually checks type, size and (for images) dimensions after you set the file – so assert on the preview, file name, progress or error.

**Download.** Clicking a download link fires a `download` event. Catch it, then read `suggestedFilename()` and `saveAs()` it to check the content.

📄 Cheat sheet: [§18 Upload](LOCATORS_CHEATSHEET.md#18-file-upload), [§19 Download](LOCATORS_CHEATSHEET.md#19-file-download), [§46 KYC](LOCATORS_CHEATSHEET.md#46-kyc--income-documents)
🧩 In this project:
- [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) – `ArtistImage.valid` / `tooSmall` (the site rejects images under 1080 × 1080).
- [AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts) – `TrackFile.valid` (a real 16-bit/44.1 kHz WAV) and `notAudio`; waits for "100%" before Next.
- Files: `src/data/files/`.

---

# Part C – Events, pages, network

## 15. Events and the "start waiting before you click" rule

Some things happen **because of** an action: a download starts, a popup opens, a request is sent, a dialog appears. If you click first and *then* start waiting, the event may already be over – you wait forever.

So the pattern is always:

```ts
const downloadPromise = page.waitForEvent('download'); // 1. start listening (no await!)
await page.getByRole('button', { name: 'Export' }).click(); // 2. trigger it
const download = await downloadPromise;                // 3. now wait for the result
```

Same for `waitForEvent('popup')`, `waitForEvent('filechooser')`, `waitForResponse(...)`. For native dialogs you register a handler with `page.once('dialog', ...)` before the click.

📄 Cheat sheet: [§19](LOCATORS_CHEATSHEET.md#19-file-download), [§21](LOCATORS_CHEATSHEET.md#21-links--new-tab--popup), [§32](LOCATORS_CHEATSHEET.md#32-wait-for--mock-api-calls)
🧩 In this project: [BasePage.ts](src/core/ui/BasePage.ts) `actionAndWaitForResponse()` – uses `Promise.all` to start waiting and act at the same time.

## 16. Native dialogs vs HTML modals

- **Native dialogs** – `window.alert()`, `confirm()`, `prompt()`, and the "Leave site?" `beforeunload` box. Drawn by the browser, **not in the DOM** – no locator can find them. Playwright **auto-dismisses** them unless you add `page.on/once('dialog', ...)` and call `accept()` / `dismiss()`.
- **HTML modals** – a `<div role="dialog">` drawn by the app. Normal page content: find with `getByRole('dialog')` and click its buttons.

Most modern apps use HTML modals; old admin screens often use `confirm()`.

📄 Cheat sheet: [§22 Native](LOCATORS_CHEATSHEET.md#22-browser-alert--confirm--prompt), [§23 Modal](LOCATORS_CHEATSHEET.md#23-modal-dialog)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) `discard()` – an HTML modal ("Yes, discard changes"); [BasePage.ts](src/core/ui/BasePage.ts) `acceptNextDialog()` – for native ones.

## 17. Browser, context, page – tabs, popups, multiple users

```
Browser (one Chrome process)
 └── BrowserContext (like a fresh incognito window – own cookies, storage, session)
      └── Page (one tab)
```

- Each test gets its **own context** – that's why tests don't share logins or cookies and can run in parallel.
- A link with `target="_blank"` opens a new **page in the same context** → catch it with `waitForEvent('popup')`.
- **Two users at once** (maker–checker) = **two contexts**, each with its own `storageState`. Two pages in one context would share the same login.

📄 Cheat sheet: [§21 New tab](LOCATORS_CHEATSHEET.md#21-links--new-tab--popup), [§36 Roles](LOCATORS_CHEATSHEET.md#36-multiple-users--roles-login-once-per-role), [§47 Workflow](LOCATORS_CHEATSHEET.md#47-status-workflow-makerchecker-audit-trail)
🧩 More: the "Browser vs BrowserContext vs Page" chapter in [PLAYWRIGHT_NOTES.md](../PLAYWRIGHT_NOTES.md).

## 18. iframes

An `<iframe>` is a separate web page embedded in the page (payment forms, embedded docs, chat widgets). Locators from `page` **do not see inside it** – you must enter the frame first with `page.frameLocator('iframe[...]')` (or `locator.contentFrame()`), then locate inside. Everything else (auto-wait, assertions) works the same.

📄 Cheat sheet: [§29 iframe](LOCATORS_CHEATSHEET.md#29-iframe)

## 19. Network: waiting for, mocking and blocking requests

The UI talks to the backend through HTTP requests. Playwright can **watch** and **intercept** them:

- `waitForResponse()` – wait for a specific request to finish and read its status/body. Use it to capture ids the backend created, or to make sure a save really happened.
- `page.route(pattern, handler)` – intercept matching requests:
  - `route.fulfill({...})` – answer with fake data (**mock**) – test empty states, errors (500), slow responses, without changing the backend.
  - `route.abort()` – block (analytics, payment providers, ads).
  - `route.fetch()` then `fulfill` – let the real request go, then modify the response.
- Routes must be registered **before** the request is sent (before `goto` / the click).

Mocking makes UI tests fast and deterministic, but a mocked test doesn't prove the real backend works – keep some real end-to-end tests too.

📄 Cheat sheet: [§32 API calls](LOCATORS_CHEATSHEET.md#32-wait-for--mock-api-calls)
🧩 In this project: [AddArtistPage.ts](src/pages/auddia/AddArtistPage.ts) `createArtist()` – waits for the redirect URL and reads the new id from it (another way to capture what the backend created).

## 20. Controlling time with `page.clock`

Logic that depends on time (session timeout after 15 min, "due in 3 days", age 18+, today's date in a date picker) is impossible to test by really waiting. `page.clock` replaces the page's clock:

- `page.clock.install()` – take control (call before `goto`).
- `page.clock.fastForward('16:00')` – jump 16 minutes ahead instantly; timers fire.
- `page.clock.setFixedTime(date)` – "today" is always this date.

📄 Cheat sheet: [§28 Date picker](LOCATORS_CHEATSHEET.md#28-date-picker-calendar-widget), [§37 Session timeout](LOCATORS_CHEATSHEET.md#37-session-timeout-logout-browser-storage)

---

# Part D – Framework ideas

## 21. Page Object Model

A **page object** is a class that represents one page (or one component). It holds:

- the **locators** (created in the constructor),
- the **actions** a user can do there (`login()`, `fillBasics()`, `next()`),
- small page-specific **checks** (`expectLoaded()`, `expectFieldError()`).

The **test** then reads like a story and contains the important assertions. Benefits:

- A label changes → fix it in **one** place, not in 30 tests.
- Tests are short and readable by non-developers.
- `BasePage` gives every page the same safe helpers (`fill` = clear + fill, `expectVisible`, `open`).

Components (toast, header, table) that appear on many pages get their own class based on `BaseComponent`, scoped to a `root` locator.

📄 Cheat sheet: [§2 How it fits in the framework](LOCATORS_CHEATSHEET.md#2-how-it-fits-in-the-framework)
🧩 In this project: [BasePage.ts](src/core/ui/BasePage.ts), [BaseComponent.ts](src/core/ui/BaseComponent.ts), [AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts), [Toast.ts](src/pages/auddia/components/Toast.ts).

## 22. Fixtures

A **fixture** is something a test needs, prepared by Playwright and handed to the test as a parameter:

```ts
test('...', async ({ page, addArtistPage, cleanup }) => { ... });
```

- Playwright creates only the fixtures a test asks for, and cleans them up afterwards (code after `await use(...)` is the teardown).
- Built-in fixtures: `page`, `context`, `browser`, `request`.
- Custom fixtures are added with `test.extend({...})` – here: page objects, API services, `cleanup`, and an automatic logger.
- **Auto fixtures** (`{ auto: true }`) run for every test without being asked for – e.g. the start/end logger.
- This replaces most `beforeEach`/`afterEach` code and keeps setup reusable.

🧩 In this project: [base.fixture.ts](src/fixtures/base.fixture.ts) (cleanup + logger), [auddia.fixture.ts](src/fixtures/auddia.fixture.ts) (page objects + API clients).

## 23. The `@step` decorator and `test.step`

`test.step('name', fn)` groups actions under one readable line in the HTML report and trace. Instead of 40 raw clicks you see "AuddiaAddTrackPage.fillUpload → AuddiaAddTrackPage.next → …", and a failure points at the business step that broke.

`@step()` is a **TypeScript decorator** that wraps a class method in `test.step` automatically, named `ClassName.method`. Because decorators only work on **class methods**:

- page objects / services → `@step()` on action methods,
- spec files (no class) → `await test.step('...', async () => {...})` if you want grouping there.

Convention here: decorate **actions**; leave `expectX()` assertion helpers undecorated (their failure already shows clearly).

🧩 In this project: [step.decorator.ts](src/core/utils/step.decorator.ts); used across [AddTrackPage.ts](src/pages/auddia/AddTrackPage.ts).

## 24. Sessions: `storageState` and the setup project

Logging in through the UI in every test is slow and hammers the login endpoint. Instead:

1. A **setup project** logs in once (via API or UI).
2. It saves cookies + localStorage to a JSON file with `storageState({ path })`.
3. Other projects declare `dependencies: ['setup']` and `use: { storageState: thatFile }` → every test starts already logged in.

To test login/logout itself, start a test file logged out: `test.use({ storageState: { cookies: [], origins: [] } })`.
Several roles = one file per role (`.auth/officer.json`, `.auth/manager.json`).

The `.auth/` folder contains real tokens → it's in `.gitignore`.

📄 Cheat sheet: [§36 Roles](LOCATORS_CHEATSHEET.md#36-multiple-users--roles-login-once-per-role)
🧩 In this project: [playwright.config.ts](playwright.config.ts) (projects + dependencies), [auddia.setup.ts](tests/auddia/auddia.setup.ts), [session.ts](src/api/auddia/session.ts) (builds the storage state from an API login), [login.ui.spec.ts](tests/auddia/login.ui.spec.ts) (starts logged out).

## 25. Config and secrets with dotenv

URLs and credentials change per environment and must never be committed. **dotenv** reads `KEY=value` lines from a file into `process.env`. One `config` object then exposes typed values to the whole framework.

- Order: real environment variables (CI secrets) → `env/.env.local` (your machine) → `env/.env.<TEST_ENV>`. The first value found wins.
- `read('X')` = required → the run stops at once with a clear message if it's missing.
- `process.env.X ?? 'default'` = optional.

📄 Full explanation: [Readme.setup.md – Step 6](Readme.setup.md#step-6--environment-variables-with-dotenv)
🧩 In this project: [env.config.ts](src/config/env.config.ts), `env/.env.local.example`.

## 26. Serial vs parallel tests

By default (`fullyParallel: true`) tests run **in parallel** and **in any order**. That's fast, and it forces every test to be independent.

When tests genuinely depend on each other, there are two options:

- `test.describe.configure({ mode: 'serial' })` – run in order in one worker; **if one fails, the rest are skipped**. Use when later tests need what an earlier test created (the artist id in the add-track tests).
- `mode: 'default'` – run in order in one worker, but each test runs even if the previous failed. Use when tests share one account and would step on each other in parallel (edit-profile tests).

Prefer independent tests; use serial only when the dependency is the point.

🧩 In this project: [add-track.ui.spec.ts](tests/auddia/add-track.ui.spec.ts) (serial – needs the created artist), [edit-profile.ui.spec.ts](tests/auddia/edit-profile.ui.spec.ts) (default – shared account).

## 27. Test data: unique, realistic, cleaned up

- **Unique** – parallel tests and re-runs must not collide (same email registered twice). Add randomness: `faker`, `Date.now()`.
- **Realistic** – `faker` gives believable names, companies, dates.
- **Recognisable** – a prefix like `PW Artist …` / `QA…` makes test data easy to find and delete.
- **Valid by default** – a builder returns a fully valid object; each test overrides only the field it's about (`buildLoanApplication({ amount: 49999 })`).
- **Cleaned up** – register deletes with the `cleanup` fixture so they run even if the test fails. If the app can't delete (Auddia artists), say so in the test file.

📄 Cheat sheet: [§49 Test data builder](LOCATORS_CHEATSHEET.md#49-test-data-builder-unique-realistic-no-collisions)
🧩 In this project: [CleanupManager.ts](src/core/utils/CleanupManager.ts), [dataFactory.ts](src/data/dataFactory.ts), the header comment of [add-track.ui.spec.ts](tests/auddia/add-track.ui.spec.ts).

## 28. Hybrid tests: API for setup, UI for the check

The **test pyramid**: many fast API/unit tests, fewer UI tests, very few full end-to-end tests. A UI test that first clicks through five screens just to create data is slow and fragile.

Hybrid approach: create the precondition through the **API** (seconds), then use the **UI** only for the behaviour under test. Bonus: you get the id directly from the API response for cleanup.

📄 Cheat sheet: [§40 Hybrid](LOCATORS_CHEATSHEET.md#40-hybrid-create-data-by-api-check-it-in-the-ui)
🧩 In this project: [ApiClient.ts](src/core/api/ApiClient.ts), [api.fixture.ts](src/fixtures/api.fixture.ts), [employee-lifecycle.e2e.spec.ts](tests/e2e/employee-lifecycle.e2e.spec.ts).

---

# Part E – Test design theory

## 29. Equivalence partitioning and boundary values

You can't test every possible input, so you pick smart ones.

**Equivalence partitioning** – split inputs into groups that the app treats the same; one value per group is enough.
Loan amount with min ₹50,000 and max ₹50,00,000 → groups: *below min*, *valid*, *above max*, *not a number*, *negative*.

**Boundary value analysis** – bugs hide at the edges (`<` written instead of `<=`). Test **just below, on, and just above** each limit:

| Value | Expected |
|---|---|
| 49,999 | error (min − 1) |
| 50,000 | OK (min) |
| 50,00,000 | OK (max) |
| 50,00,001 | error (max + 1) |

Same idea for credit-score cut-offs (649 / 650), age (17 / 18), bio length (600 / 601), image size (1079 / 1080 px).

📄 Cheat sheet: [§42 Money fields](LOCATORS_CHEATSHEET.md#42-money-fields--amount-currency-format-rounding), [§44 Eligibility](LOCATORS_CHEATSHEET.md#44-eligibility-rules-income-dti-credit-score-age)
🧩 In this project: [add-artist.ui.spec.ts](tests/auddia/add-artist.ui.spec.ts) – the 601-character bio test.

## 30. Data-driven tests

When several tests differ only in their data, write **one** test body and loop over a table of cases:

```ts
for (const { value, error } of cases) {
  test(`rejects "${value}"`, async ({ page }) => { ... });
}
```

- Each case becomes its own test, with its own name in the report – you see exactly which value failed.
- Adding a case = adding one line of data.
- Put the varying value in the test title so names stay unique (duplicate titles are an error).

📄 Cheat sheet: [§33 Validation pattern](LOCATORS_CHEATSHEET.md#33-form-validation-pattern-data-driven), [§7 Email](LOCATORS_CHEATSHEET.md#7-email-input--validator-function)
🧩 In this project: [auth.api.spec.ts](tests/api/auth.api.spec.ts) – the "rejects login: …" cases.

## 31. Positive, negative and edge cases

- **Positive (happy path)** – valid input, expected success. Tag `@smoke` for the most important ones.
- **Negative** – invalid input or forbidden action; the app must refuse clearly (message, disabled button, 4xx status). Tag `@negative`.
- **Edge cases** – unusual but valid: 0% interest, maximum length, special characters (`O'Brien`), leading/trailing spaces, double-click, browser back button.

A feature is not tested until its negative cases are tested – most real bugs live there.

🧩 In this project: [tags.ts](src/config/tags.ts); `npm run test:smoke`, `--grep @negative`.

## 32. Why tests are flaky – and the cures

A **flaky** test passes and fails on the same code. Common causes:

| Cause | Cure |
|---|---|
| Hard sleeps (`waitForTimeout`) | wait for a condition: visible element, URL, response |
| Checking once (`expect(await x.isVisible())`) | web-first `await expect(x).toBeVisible()` |
| Waiting for an event after triggering it | start `waitForEvent/Response` **before** the click |
| Tests sharing data / depending on order | unique data per test, own setup, cleanup |
| Covered elements (open dropdown, toast, overlay) | close it (`Escape`), wait for it to go |
| Animations | auto-wait handles it; don't use `force: true` |
| Toasts that disappear | assert immediately after the action |
| Real time (dates, timeouts) | `page.clock` |
| Unstable locators (CSS paths, `nth`) | role/label/text locators, filter by content |

Tools: the **trace viewer** (`retain-on-failure` in config) shows every step with DOM snapshots, network and console – open it before guessing.

📄 Cheat sheet: [§35 Debugging](LOCATORS_CHEATSHEET.md#35-debugging-tips)

---

# Part F – Loan application theory

## 33. EMI and the reducing-balance formula

**EMI** (Equated Monthly Instalment) = the fixed amount paid every month. Each payment covers that month's interest first; the rest reduces the principal. As the balance shrinks, the interest part shrinks and the principal part grows – but the total EMI stays the same.

```
EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)

P = principal (loan amount)
r = monthly interest rate = annual rate ÷ 12 ÷ 100
n = number of months
```

Example: ₹1,00,000 at 10% for 12 months → r = 0.008333, (1 + r)^12 = 1.10471 → **EMI = ₹8,791.59**.
Special case: 0% interest → EMI = P ÷ n (the formula would divide by zero).

Why put it in a helper (`calculateEmi`)? The test computes the **expected** value independently and compares it with what the UI shows. If the app's calculation is wrong, the test catches it.

📄 Cheat sheet: [§43 EMI calculator](LOCATORS_CHEATSHEET.md#43-emi-calculator--repayment-schedule)

## 34. Amortization schedule

The month-by-month table of how each EMI splits into interest and principal:

```
interest this month  = balance × r
principal this month = EMI − interest
new balance          = balance − principal
```

Properties that must always hold – great things to assert:
- number of rows = tenure in months,
- sum of all principal parts = loan amount,
- final balance = 0,
- interest per month only goes down.

Because of rounding, the last month usually differs by a few paise – the helper lets the last row absorb that difference.

## 35. Floating-point money and rounding

Computers store decimals in binary, so `0.1 + 0.2 = 0.30000000000000004`. With money that means:

- Round to 2 decimals at each step the business rules say to (`round2`).
- Compare money with `toBeCloseTo(expected, 2)` (or 0 for whole rupees), not `toBe`.
- Parse UI text into numbers before comparing (`parseAmount('₹1,00,000.50')` → `100000.5`) – the screen shows formatted text, not numbers.
- Formatting depends on locale: India groups as `1,00,000`, US as `100,000`. `Intl.NumberFormat` does it correctly.

## 36. Eligibility rules and DTI

Lenders decide eligibility with rules such as:

- **Credit score** at or above a cut-off (e.g. 650).
- **Age** – at least 18 at the start, and below retirement age when the loan ends (age + tenure).
- **Income** above a minimum.
- **DTI – debt-to-income ratio** = (existing EMIs + new EMI) ÷ monthly income × 100. If too much of the income already goes to repayments (e.g. > 50%), the loan is refused.

These rules are pure logic – test them mostly through the **API** with many boundary cases (fast), and add a few UI tests that check the user sees a clear reason.

📄 Cheat sheet: [§44 Eligibility](LOCATORS_CHEATSHEET.md#44-eligibility-rules-income-dti-credit-score-age)

## 37. Workflows as state machines

A loan moves through **states** (Draft → Submitted → Under review → Approved → Disbursed, or Rejected). Only certain **transitions** are allowed, and each is allowed only for certain roles.

Draw it as a table and test both sides:

| From → To | Allowed? | Who |
|---|---|---|
| Draft → Submitted | ✅ | officer |
| Submitted → Under review | ✅ | underwriter |
| Under review → Approved | ✅ | manager |
| Draft → Disbursed | ❌ | – |
| Approved → Draft | ❌ | – |

- Every ✅ → a positive test (button visible, status changes, audit entry appears).
- Every ❌ → a negative test, ideally through the **API** (the UI may just hide the button, but the backend must refuse too – expect 403/409).
- After a final state (Approved/Disbursed), editing must be locked.

📄 Cheat sheet: [§47 Workflow](LOCATORS_CHEATSHEET.md#47-status-workflow-makerchecker-audit-trail)

## 38. Maker–checker (four-eyes principle)

In banking, the person who **creates** something (maker) must not be the one who **approves** it (checker). This prevents fraud and mistakes. Tests:

- The maker doesn't see / can't use "Approve" on their own application – in the UI **and** via the API.
- A different user with the right role can approve.
- Testing it needs **two logged-in users** → two browser contexts (section 17).

## 39. Roles and access control (RBAC)

**RBAC – role-based access control**: what you can see and do depends on your role. Test three layers, because hiding a button isn't security:

1. **UI** – menus and buttons shown/hidden per role.
2. **Direct URL** – typing `/admin/settings` as an officer must be refused, not just "not linked".
3. **API** – the request itself must be refused with 401/403 for the wrong role.

Also check **data scope**: an officer of branch A must not see branch B's applications.

📄 Cheat sheet: [§36 Roles](LOCATORS_CHEATSHEET.md#36-multiple-users--roles-login-once-per-role)

## 40. PII: masking and where data must never appear

**PII** (personally identifiable information): PAN, Aadhaar, SSN, account numbers, phone, date of birth, income. Rules apps usually follow, and tests should check:

- **Masked on screen** – only the last 4 digits (`XXXX XXXX 9012`), full value only for roles that need it.
- **Never in URLs** – URLs end up in browser history, server logs and analytics.
- **Never in test reports** – our `ApiClient` masks `password|token|secret` before attaching bodies; extend the pattern for PII fields.
- **Never committed** – real test credentials only in `env/.env.local` / CI secrets.

🧩 In this project: `maskSecrets()` in [ApiClient.ts](src/core/api/ApiClient.ts).

## 41. Double submit and concurrent edits

- **Double submit** – a user double-clicks "Submit" or the network is slow and they click again. The app must create **one** application, not two (button disabled while saving, or the backend detects duplicates – *idempotency*). Test: `dblclick()` + count the POST requests.
- **Concurrent edits** – two officers open the same application, both save. Without protection the second save silently overwrites the first (*lost update*). Good apps use **optimistic locking**: each record has a version; saving an old version is refused with a "modified by another user" message. Test it with two contexts.

📄 Cheat sheet: [§50 Checklist](LOCATORS_CHEATSHEET.md#50-loan-app-test-checklist)

## 42. Audit trail

Regulated apps must record **who did what, when** (created, edited – often with old/new values –, submitted, approved, rejected with reason). Auditors rely on it, so test it like a feature:

- every workflow action adds exactly one entry,
- entries show the right user, role, action and time,
- entries can't be edited or deleted from the UI.

📄 Cheat sheet: [§47 Workflow](LOCATORS_CHEATSHEET.md#47-status-workflow-makerchecker-audit-trail)

---

## Glossary

| Term | Meaning |
|---|---|
| **Accessible name** | The text a screen reader reads for an element; what `{ name }` matches in `getByRole` |
| **Actionability** | The checks Playwright waits for before acting (visible, stable, enabled…) |
| **ARIA** | HTML attributes (`role`, `aria-label`, `aria-checked`…) that describe custom elements to assistive tech |
| **Auto fixture** | A fixture that runs for every test without being requested |
| **Blur** | An element losing focus – often triggers validation |
| **BrowserContext** | An isolated browser session (own cookies/storage), like an incognito window |
| **DOM** | The tree of HTML elements the browser builds from the page |
| **DTI** | Debt-to-income ratio – share of monthly income going to loan repayments |
| **EMI** | Equated Monthly Instalment – fixed monthly loan payment |
| **Flaky test** | A test that sometimes passes and sometimes fails without code changes |
| **Fixture** | Something prepared for a test and passed in as a parameter (`page`, `cleanup`, page objects) |
| **Idempotent** | Doing it twice has the same effect as doing it once |
| **KYC** | Know Your Customer – identity/address checks with documents |
| **Locator** | A lazy recipe for finding element(s); searched fresh on every use |
| **Maker–checker** | One person creates, a different person approves |
| **Mock** | A fake response returned instead of calling the real backend |
| **Optimistic locking** | Rejecting a save if the record changed since it was loaded |
| **Page object** | A class holding one page's locators and actions |
| **PII** | Personally identifiable information (PAN, Aadhaar, SSN, phone…) |
| **RBAC** | Role-based access control |
| **storageState** | Saved cookies + localStorage used to start tests already logged in |
| **Strict mode** | Playwright refusing to act when a locator matches more than one element |
| **Trace** | Recorded timeline of a test (actions, DOM snapshots, network) – open with `show-trace` |
| **Web-first assertion** | An `expect` on a locator/page that retries until it passes or times out |
