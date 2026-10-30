# Auddia UI tests: file-by-file walkthrough

UI tests for the Auddia stage site (DiscovrRadio): login, logout and edit profile, all through the browser like a real user.

**Order:** config → base page → component → pages → fixture → login tests → edit-profile tests → run → report

```
src/pages/auddia/components/Toast.ts
src/pages/auddia/LoginPage.ts
src/pages/auddia/DashboardPage.ts
src/pages/auddia/MyProfilePage.ts
src/pages/auddia/EditProfilePage.ts
src/fixtures/auddia.fixture.ts
tests/auddia/login.ui.spec.ts
tests/auddia/edit-profile.ui.spec.ts
```

There are two layers: **pages** describe what is on the screen, and **tests** describe what to check.

---

## Step 1: Config

- **`env/.env.local`** stores the secrets (Auddia URL, email, password). It is git-ignored, so credentials are never committed. Copy `env/.env.local.example` and fill in your own values.
- **`src/config/env.config.ts`**: the `get auddia()` getter reads those values. It only runs when an Auddia test needs them, so other tests never fail because of missing Auddia variables.
- **`playwright.config.ts`**: the `auddia` project sets `baseURL`, so page objects only need paths like `/login`.

## Step 2: BasePage, the foundation

**`src/core/ui/BasePage.ts`** holds the common work every page needs: `open()`, `fill()`, `click()`, `expectVisible()`, `expectUrlContains()`.
Every page extends it. Playwright auto-waits, so there is no `waitForTimeout` anywhere.

## Step 3: Toast component

**`src/pages/auddia/components/Toast.ts`**: the toast message appears on several pages (login error, login success, profile saved), so it is written once as a component.
It extends `BaseComponent` and finds the toast by its role `alert`. Toasts vanish after ~4 seconds, so tests check them right after the action.

## Step 4: Page objects

Each page keeps its locators in the constructor and its actions as methods. If the UI changes, only the page file changes, never the tests.

- **`LoginPage.ts`**: email, password, Show/Hide password, Sign in, plus `login()`, `touchFields()` (triggers validation) and `expectFieldError()`.
  - The password locator uses `{ exact: true }`; without it, the "Show Password" button also matches.
  - The eye button is renamed from "Show Password" to "Hide Password" after the first click, so it has two locators.
- **`DashboardPage.ts`**: the landing page after login. It has the heading plus the **Settings** and **Sign out** links (they are links, not buttons).
- **`MyProfilePage.ts`**: the start and end of the edit flow. It opens the edit form and checks that the saved name is shown.
- **`EditProfilePage.ts`**: first name, last name, email, Update, Cancel and Back.
  - `expectLoaded()` waits until the saved data is in the form.
  - `expectSaved()` checks for the success toast and the redirect to My profile.

`@step()` on a method shows it as one readable step in the report, e.g. `AuddiaLoginPage.login`.

## Step 5: Fixture

**`src/fixtures/auddia.fixture.ts`** loads the page objects (`loginPage`, `dashboardPage`, `myProfilePage`, `editProfilePage`).
A test just asks for `{ loginPage }` and gets a ready object; no test writes `new ...Page(page)`. Fixtures are lazy, so only what a test asks for is created.

## Step 6: Login and logout tests

**`tests/auddia/login.ui.spec.ts`** contains 8 tests:

- empty form keeps Sign in disabled
- required-field messages
- invalid email format
- fields are editable
- show/hide password
- wrong password shows an error toast
- valid login shows a success toast and opens the dashboard
- Sign out returns to login, removes the token, and blocks the dashboard

`test.use({ storageState: { cookies: [], origins: [] } })` starts every test in a clean, logged-out browser. Tests run in parallel.

## Step 7: Edit profile tests

**`tests/auddia/edit-profile.ui.spec.ts`** contains 7 tests:

- saved profile is shown in the form
- Update is enabled only after a change
- required-field messages
- invalid email format
- Cancel discards changes
- Back link goes to My profile
- **save** shows a success toast and the new name

Each test logs in through the form and opens Settings → Edit profile, just like a user.

- `mode: 'default'` runs these tests one after another, because they share one account (in parallel, the save test changed the name while another test was reading it).
- `afterEach` restores the original name through the UI, even if the test fails.
- The email is only validated, never saved.

## Step 8: Run

From this folder (`playwright/`):

```bash
npm install                                # first time only
npx playwright install chromium            # first time only

npx playwright test --project=auddia login.ui edit-profile.ui --no-deps --ui       # UI mode (best for demos)
npx playwright test --project=auddia login.ui edit-profile.ui --no-deps --headed   # watch the browser
npx playwright test --project=auddia login.ui --no-deps                            # login/logout only
npx playwright test --project=auddia edit-profile.ui --no-deps                     # edit profile only
```

`--no-deps` skips the API login setup, because these tests log in through the form themselves. Expected result: **15 passed**.

## Step 9: Report

```bash
npx playwright show-report reports/html
```

The report shows readable steps for every test, and a screenshot, video and trace for any failure.

---

**Takeaways**

1. Understand the app first, then automate it: every observation becomes a test case.
2. Use role and label locators (find them with `npx playwright codegen`); they stay stable.
3. Keep layers separate (component → page → fixture → test), so a UI change only touches the page file.
