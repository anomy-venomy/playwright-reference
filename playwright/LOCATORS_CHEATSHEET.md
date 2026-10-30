# Playwright Locators & Test Cheat Sheet

Copy-paste reference: for every common UI element → **HTML example → locator → actions → test**.
Works with the framework from `Readme.setup.md` (page objects extend `BasePage`, actions use `@step()`).

## Contents

1. [Locator priority – which one to use](#1-locator-priority--which-one-to-use)
2. [How it fits in the framework (page object + test)](#2-how-it-fits-in-the-framework)
3. [Text input](#3-text-input)
4. [Textarea + character limit](#4-textarea--character-limit)
5. [Number input](#5-number-input)
6. [Password input + show/hide](#6-password-input--showhide)
7. [Email input + validator function](#7-email-input--validator-function)
8. [Date / time input](#8-date--time-input)
9. [Checkbox](#9-checkbox)
10. [Radio buttons](#10-radio-buttons)
11. [Toggle switch](#11-toggle-switch)
12. [Button click (single, double, right, disabled)](#12-button-click)
13. [Hover + tooltip](#13-hover--tooltip)
14. [Dropdown – native `<select>`](#14-dropdown--native-select)
15. [Dropdown – custom / autocomplete](#15-dropdown--custom--autocomplete)
16. [Multi-select (native + chips)](#16-multi-select)
17. [Range slider](#17-range-slider)
18. [File upload](#18-file-upload)
19. [File download](#19-file-download)
20. [Drag and drop](#20-drag-and-drop)
21. [Links + new tab / popup](#21-links--new-tab--popup)
22. [Browser alert / confirm / prompt](#22-browser-alert--confirm--prompt)
23. [Modal dialog](#23-modal-dialog)
24. [Toast / snackbar](#24-toast--snackbar)
25. [Table – find row, read cell, sort](#25-table)
26. [Lists + counting items](#26-lists--counting-items)
27. [Tabs + accordion](#27-tabs--accordion)
28. [Date picker (calendar widget)](#28-date-picker-calendar-widget)
29. [iframe](#29-iframe)
30. [Keyboard shortcuts](#30-keyboard-shortcuts)
31. [Scroll + infinite scroll](#31-scroll--infinite-scroll)
32. [Wait for / mock API calls](#32-wait-for--mock-api-calls)
33. [Form validation pattern (data-driven)](#33-form-validation-pattern-data-driven)
34. [Assertions quick list](#34-assertions-quick-list)
35. [Debugging tips](#35-debugging-tips)

**Part 2 – Extras every internal app needs**

36. [Multiple users / roles](#36-multiple-users--roles-login-once-per-role)
37. [Session timeout, logout, browser storage](#37-session-timeout-logout-browser-storage)
38. [Accessibility check (axe)](#38-accessibility-check-axe)
39. [Visual check, mobile view, offline, permissions](#39-visual-check-mobile-view-offline-permissions)
40. [Hybrid: create data by API, check it in the UI](#40-hybrid-create-data-by-api-check-it-in-the-ui)

**Part 3 – Loan application (internal team)**

41. [Identity & masked fields (PAN, Aadhaar, SSN, phone, IFSC)](#41-identity--masked-fields-pan-aadhaar-ssn-phone-ifsc)
42. [Money fields – amount, currency, rounding](#42-money-fields--amount-currency-format-rounding)
43. [EMI calculator + repayment schedule](#43-emi-calculator--repayment-schedule)
44. [Eligibility rules (income, DTI, credit score, age)](#44-eligibility-rules-income-dti-credit-score-age)
45. [Multi-step application wizard](#45-multi-step-application-wizard-save-draft-resume-backnext)
46. [KYC & income documents](#46-kyc--income-documents)
47. [Status workflow, maker–checker, audit trail](#47-status-workflow-makerchecker-audit-trail)
48. [Loan list – search, filters, export, PDF](#48-loan-list--search-filters-export-sanction-letter-pdf)
49. [Test data builder](#49-test-data-builder-unique-realistic-no-collisions)
50. [Loan app test checklist](#50-loan-app-test-checklist)

---

## 1. Locator priority – which one to use

Use the first one that works. Higher = closer to what a real user sees = less flaky.

| # | Locator | Example | Use for |
|---|---|---|---|
| 1 | `getByRole` | `page.getByRole('button', { name: 'Save' })` | buttons, links, inputs, headings, checkboxes… |
| 2 | `getByLabel` | `page.getByLabel('Email address')` | form fields with a `<label>` |
| 3 | `getByPlaceholder` | `page.getByPlaceholder('Search')` | inputs without a label |
| 4 | `getByText` | `page.getByText('Welcome back')` | plain text, messages |
| 5 | `getByAltText` | `page.getByAltText('Company logo')` | images |
| 6 | `getByTitle` | `page.getByTitle('Close')` | elements with `title=""` |
| 7 | `getByTestId` | `page.getByTestId('submit-btn')` | when nothing above is stable (`data-testid`) |
| 8 | `locator(css)` | `page.locator('input[type="file"]')` | last resort / hidden elements |

**Useful options and chaining**

```ts
page.getByRole('button', { name: 'Save', exact: true }); // exact text match (default is substring, case-insensitive)
page.getByRole('heading', { name: /dashboard/i });        // regex
page.getByRole('heading', { level: 2 });                  // <h2>
page.getByText('Delete').first();                          // first / last() / nth(2)
page.getByRole('row').filter({ hasText: 'John' });         // narrow down by text
page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Edit' }) }); // by child
page.getByRole('dialog').getByRole('button', { name: 'OK' }); // scope inside a parent
page.getByLabel('Password', { exact: true });              // avoid also matching "Show Password"
page.getByRole('button').and(page.getByTitle('Close'));    // both conditions
page.getByRole('button', { name: 'Save' }).or(page.getByRole('button', { name: 'Update' })); // either
```

> **Strict mode:** an action fails if a locator matches more than one element ("strict mode violation").
> Fix it with `exact: true`, a role instead of a label, `.filter()`, scoping, or `.first()` (last resort).

**Find locators fast:** `npx playwright codegen <url>` or the "Pick locator" button in the VS Code extension / UI mode.

---

## 2. How it fits in the framework

Locators go in the page-object **constructor**, actions are methods with `@step()`, assertions stay in the test.

```ts
// src/pages/ProfilePage.ts
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

export class ProfilePage extends BasePage {
  protected readonly path = '/profile';

  readonly nameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Full name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/profile');
    await this.expectVisible(this.nameInput);
  }

  @step()
  async updateName(name: string): Promise<void> {
    await this.fill(this.nameInput, name);
    await this.click(this.saveButton);
  }
}
```

```ts
// src/fixtures/... – register it once
profilePage: async ({ page }, use) => use(new ProfilePage(page)),
```

```ts
// tests/ui/profile.ui.spec.ts
import { test, expect } from '@fixtures/index';

test('updates the name', async ({ profilePage }) => {
  await profilePage.open();
  await profilePage.updateName('Jane Doe');
  await expect(profilePage.nameInput).toHaveValue('Jane Doe');
});
```

The snippets below use `page` directly to stay short – move locators/actions into your page objects the same way.

---

## 3. Text input

```html
<label for="name">Full name</label>
<input id="name" type="text" placeholder="Enter name" />
```

```ts
const name = page.getByLabel('Full name');
// or: page.getByRole('textbox', { name: 'Full name' })
// or: page.getByPlaceholder('Enter name')

await name.fill('Jane Doe');                   // replaces the whole value (fast)
await name.clear();                            // empty it
await name.pressSequentially('Jane', { delay: 50 }); // type key by key (autocomplete, masks, live search)
await name.press('Enter');
await name.blur();                             // leave the field → triggers "on blur" validation
const value = await name.inputValue();         // read current value
```

```ts
test('text input keeps the typed value', async ({ page }) => {
  const name = page.getByLabel('Full name');
  await name.fill('Jane Doe');
  await expect(name).toHaveValue('Jane Doe');
});

test('name is required', async ({ page }) => {
  const name = page.getByLabel('Full name');
  await name.click();
  await name.blur();
  await expect(page.getByText('Name is required')).toBeVisible();
});

test('field attributes', async ({ page }) => {
  const name = page.getByLabel('Full name');
  await expect(name).toBeEditable();
  await expect(name).toBeEmpty();
  await expect(name).toHaveAttribute('maxlength', '50');
  await expect(name).toHaveAttribute('placeholder', 'Enter name');
});
```

---

## 4. Textarea + character limit

```html
<label for="bio">Bio</label>
<textarea id="bio" maxlength="600"></textarea>
<span>0/600</span>
```

```ts
const bio = page.getByLabel('Bio'); // or getByRole('textbox', { name: 'Bio' })
await bio.fill('Line 1\nLine 2');  // \n = new line
```

```ts
test('bio shows a character counter', async ({ page }) => {
  await page.getByLabel('Bio').fill('a'.repeat(120));
  await expect(page.getByText('120/600')).toBeVisible();
});

test('bio cannot exceed 600 characters', async ({ page }) => {
  const bio = page.getByLabel('Bio');
  await bio.fill('a'.repeat(650));
  // with maxlength the browser cuts it; without it, expect an error / disabled submit instead
  await expect(bio).toHaveValue('a'.repeat(600));
});
```

---

## 5. Number input

```html
<label for="age">Age</label>
<input id="age" type="number" min="18" max="99" step="1" />
```

```ts
const age = page.getByLabel('Age'); // role is 'spinbutton': page.getByRole('spinbutton', { name: 'Age' })
await age.fill('25');               // fill() takes a STRING
await age.press('ArrowUp');         // +step → 26
await age.press('ArrowDown');       // -step → 25
```

```ts
test('accepts a number in range', async ({ page }) => {
  const age = page.getByLabel('Age');
  await age.fill('25');
  await expect(age).toHaveValue('25');
});

test('arrow keys change the value by step', async ({ page }) => {
  const age = page.getByLabel('Age');
  await age.fill('25');
  await age.press('ArrowUp');
  await expect(age).toHaveValue('26');
});

test('rejects values below min', async ({ page }) => {
  const age = page.getByLabel('Age');
  await age.fill('10');
  await age.blur();
  await expect(page.getByText('Must be at least 18')).toBeVisible();
  // built-in browser validation (no custom message):
  expect(await age.evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
});

test('letters cannot be typed into a number field', async ({ page }) => {
  const age = page.getByLabel('Age');
  await age.pressSequentially('abc'); // fill('abc') would THROW on type=number
  await expect(age).toHaveValue('');
});
```

---

## 6. Password input + show/hide

```html
<label for="pw">Password</label>
<input id="pw" type="password" />
<button aria-label="Show Password">👁</button>
```

```ts
// exact: true – otherwise "Show Password" button matches too
const password = page.getByLabel('Password', { exact: true });
const showBtn = page.getByRole('button', { name: 'Show Password' });
const hideBtn = page.getByRole('button', { name: 'Hide Password' });

await password.fill('Secret@123');
```

```ts
test('password is masked by default', async ({ page }) => {
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
});

test('eye icon shows and hides the password', async ({ page }) => {
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('Secret@123');

  await page.getByRole('button', { name: 'Show Password' }).click();
  await expect(password).toHaveAttribute('type', 'text');

  await page.getByRole('button', { name: 'Hide Password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

// Strength rules – data-driven (see section 33)
const weakPasswords = [
  { value: 'short1!', error: 'At least 8 characters' },
  { value: 'nouppercase1!', error: 'One uppercase letter' },
  { value: 'NoNumber!', error: 'One number' },
];
for (const { value, error } of weakPasswords) {
  test(`rejects weak password: ${error}`, async ({ page }) => {
    const password = page.getByLabel('Password', { exact: true });
    await password.fill(value);
    await password.blur();
    await expect(page.getByText(error)).toBeVisible();
  });
}

test('confirm password must match', async ({ page }) => {
  await page.getByLabel('Password', { exact: true }).fill('Secret@123');
  await page.getByLabel('Confirm password').fill('Different@123');
  await page.getByLabel('Confirm password').blur();
  await expect(page.getByText('Passwords do not match')).toBeVisible();
});
```

> Never hard-code real passwords – read them from `config` (dotenv), e.g. `config.user.password`.

---

## 7. Email input + validator function

```html
<label for="email">Email address</label>
<input id="email" type="email" />
```

**Reusable validator** – `src/core/utils/validators.ts`

```ts
import { faker } from '@faker-js/faker';

/** Practical email check: something@something.tld, no spaces, one @ */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Random unique email for sign-up tests */
export const uniqueEmail = (prefix = 'qa') =>
  `${prefix}.${Date.now()}.${faker.string.alphanumeric(4)}@example.com`.toLowerCase();
```

```ts
const email = page.getByLabel('Email address'); // or getByRole('textbox', { name: 'Email address' })
await email.fill('jane@example.com');
```

```ts
import { isValidEmail, uniqueEmail } from '@core/utils/validators';

// 1. Unit test the helper itself (no browser needed)
test('isValidEmail helper', () => {
  expect(isValidEmail('jane@example.com')).toBe(true);
  expect(isValidEmail('jane@example')).toBe(false);
  expect(isValidEmail('jane example.com')).toBe(false);
});

// 2. The UI rejects every invalid format
const invalidEmails = ['plainaddress', 'missing-at.com', 'user@', '@domain.com', 'user@domain', 'us er@domain.com'];
for (const value of invalidEmails) {
  test(`rejects invalid email "${value}"`, async ({ page }) => {
    const email = page.getByLabel('Email address');
    await email.fill(value);
    await email.blur();
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });
}

// 3. The UI accepts a valid one
test('accepts a valid email', async ({ page }) => {
  const value = uniqueEmail();
  expect(isValidEmail(value)).toBe(true);
  const email = page.getByLabel('Email address');
  await email.fill(value);
  await email.blur();
  await expect(page.getByText('Invalid email address')).toBeHidden();
});

// 4. Browser built-in validation (type="email" without a custom message)
test('browser marks the field invalid', async ({ page }) => {
  const email = page.getByLabel('Email address');
  await email.fill('not-an-email');
  const message = await email.evaluate((el: HTMLInputElement) => el.validationMessage);
  expect(message).not.toBe(''); // e.g. "Please include an '@' in the email address."
});
```

---

## 8. Date / time input

```html
<input type="date" aria-label="Start date" />
<input type="time" aria-label="Start time" />
```

```ts
// Native date/time inputs: fill() with ISO format, NOT the format shown on screen
await page.getByLabel('Start date').fill('2026-12-31'); // YYYY-MM-DD
await page.getByLabel('Start time').fill('14:30');      // HH:mm
```

```ts
test('sets a start date', async ({ page }) => {
  const date = page.getByLabel('Start date');
  await date.fill('2026-12-31');
  await expect(date).toHaveValue('2026-12-31');
});
```

> For calendar pop-up widgets see [section 28](#28-date-picker-calendar-widget).

---

## 9. Checkbox

```html
<label><input type="checkbox" /> Remember me</label>
```

```ts
const remember = page.getByRole('checkbox', { name: 'Remember me' }); // or getByLabel('Remember me')
await remember.check();
await remember.uncheck();
await remember.setChecked(true); // when the value comes from data
const isOn = await remember.isChecked();
```

```ts
test('remember me can be toggled', async ({ page }) => {
  const remember = page.getByRole('checkbox', { name: 'Remember me' });
  await expect(remember).not.toBeChecked();
  await remember.check();
  await expect(remember).toBeChecked();
});

test('select all checks every row', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Select all' }).check();
  const rows = page.getByRole('row').getByRole('checkbox');
  for (const box of await rows.all()) await expect(box).toBeChecked();
});
```

> Custom checkbox (styled div) where `check()` fails? Click the visible label instead: `page.getByText('Remember me').click()`.

---

## 10. Radio buttons

```html
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" name="plan" value="free" /> Free</label>
  <label><input type="radio" name="plan" value="pro" /> Pro</label>
</fieldset>
```

```ts
await page.getByRole('radio', { name: 'Pro' }).check();
// scoped to a group when labels repeat:
await page.getByRole('group', { name: 'Plan' }).getByRole('radio', { name: 'Pro' }).check();
```

```ts
test('only one plan can be selected', async ({ page }) => {
  await page.getByRole('radio', { name: 'Free' }).check();
  await page.getByRole('radio', { name: 'Pro' }).check();
  await expect(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Free' })).not.toBeChecked();
});
```

---

## 11. Toggle switch

```html
<button role="switch" aria-checked="false" aria-label="Explicit content"></button>
<!-- or <input type="checkbox" role="switch"> -->
```

```ts
const toggle = page.getByRole('switch', { name: 'Explicit content' });
await toggle.click(); // or .check() when it is an <input type=checkbox>
```

```ts
test('switch turns on', async ({ page }) => {
  const toggle = page.getByRole('switch', { name: 'Explicit content' });
  await toggle.click();
  await expect(toggle).toBeChecked(); // works for aria-checked too
  // or: await expect(toggle).toHaveAttribute('aria-checked', 'true');
});
```

---

## 12. Button click

```html
<button type="submit">Save</button>
```

```ts
const save = page.getByRole('button', { name: 'Save' });

await save.click();                               // normal click (auto-waits: visible, enabled, stable)
await save.dblclick();                            // double click
await save.click({ button: 'right' });            // right click / context menu
await save.click({ modifiers: ['Shift'] });       // Shift+click ('Control', 'Meta', 'Alt')
await save.click({ position: { x: 5, y: 5 } });   // click at a point inside the element
await save.click({ trial: true });                // only checks it COULD be clicked, no click
// await save.click({ force: true });             // skips checks – avoid, hides real bugs
```

```ts
test('Save is disabled until the form is valid', async ({ page }) => {
  const save = page.getByRole('button', { name: 'Save' });
  await expect(save).toBeDisabled();
  await page.getByLabel('Full name').fill('Jane');
  await expect(save).toBeEnabled();
});

test('Save shows a success message', async ({ page }) => {
  await page.getByLabel('Full name').fill('Jane');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('alert')).toContainText('Saved successfully');
});

test('Save navigates to the list', async ({ page }) => {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/employees$/);
});

test('button shows a loading state', async ({ page }) => {
  const save = page.getByRole('button', { name: 'Save' });
  await save.click();
  await expect(save).toBeDisabled();          // disabled while the request runs
  await expect(save).toBeEnabled();           // back to normal afterwards
});
```

> Link styled as a button? It is a `link`: `page.getByRole('link', { name: 'Sign up' })`.

---

## 13. Hover + tooltip

```html
<button aria-describedby="tip">ℹ</button>
<div role="tooltip" id="tip">Only PNG and JPG</div>
```

```ts
await page.getByRole('button', { name: 'Info' }).hover();
await page.mouse.move(0, 0); // move away → hide tooltip
```

```ts
test('tooltip appears on hover', async ({ page }) => {
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeHidden();

  await page.getByRole('button', { name: 'Info' }).hover();
  await expect(tooltip).toHaveText('Only PNG and JPG');

  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
});

test('hover opens a menu', async ({ page }) => {
  await page.getByRole('button', { name: 'Account' }).hover();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/settings/);
});

test('hover changes the style', async ({ page }) => {
  const card = page.getByTestId('product-card');
  await card.hover();
  await expect(card).toHaveCSS('box-shadow', /rgba/);
});

test('title attribute tooltip', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveAttribute('title', 'Delete item');
});
```

---

## 14. Dropdown – native `<select>`

```html
<label for="country">Country</label>
<select id="country">
  <option value="">Choose…</option>
  <option value="us">United States</option>
  <option value="in">India</option>
</select>
```

```ts
const country = page.getByLabel('Country'); // role is 'combobox'
await country.selectOption('in');                    // by value
await country.selectOption({ label: 'India' });      // by visible text (preferred)
await country.selectOption({ index: 2 });            // by position
const options = await country.locator('option').allInnerTexts();
```

```ts
test('selects a country', async ({ page }) => {
  const country = page.getByLabel('Country');
  await country.selectOption({ label: 'India' });
  await expect(country).toHaveValue('in');
});

test('lists all countries', async ({ page }) => {
  await expect(page.getByLabel('Country').locator('option')).toHaveText(['Choose…', 'United States', 'India']);
});

test('state list depends on the country', async ({ page }) => {
  await page.getByLabel('Country').selectOption({ label: 'India' });
  await expect(page.getByLabel('State').locator('option', { hasText: 'Maharashtra' })).toBeAttached();
});
```

---

## 15. Dropdown – custom / autocomplete

React/MUI/PrimeReact/Angular dropdowns are NOT `<select>` → `selectOption()` does not work. Click, then pick the option.

```html
<input role="combobox" aria-label="State/Province" aria-expanded="false" />
<ul role="listbox"><li role="option">California</li>…</ul>
```

```ts
// 1. Plain custom dropdown
await page.getByRole('combobox', { name: 'Station format' }).click();
await page.getByRole('option', { name: 'Adult Contemporary', exact: true }).click();

// 2. Autocomplete / type-ahead: type a few letters, then pick
const state = page.getByRole('combobox', { name: 'State/Province' });
await state.pressSequentially('Calif', { delay: 80 }); // fill() may not trigger the search
await page.getByRole('option', { name: 'California', exact: true }).click();

// 3. No roles at all? fall back to text inside the open list
await page.getByTestId('country-dropdown').click();
await page.locator('.dropdown-menu').getByText('India', { exact: true }).click();
```

```ts
test('picks a state from the autocomplete', async ({ page }) => {
  const state = page.getByRole('combobox', { name: 'State/Province' });
  await state.pressSequentially('Calif', { delay: 80 });
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.getByRole('option', { name: 'California' }).click();
  await expect(state).toHaveValue('California');
});

test('autocomplete shows "no results"', async ({ page }) => {
  await page.getByRole('combobox', { name: 'State/Province' }).pressSequentially('zzzz');
  await expect(page.getByText('No results found')).toBeVisible();
});

test('keyboard selection', async ({ page }) => {
  const state = page.getByRole('combobox', { name: 'State/Province' });
  await state.click();
  await state.press('ArrowDown');
  await state.press('Enter');
  await expect(state).not.toHaveValue('');
});
```

> Long lists: Playwright scrolls to the option automatically. Virtualised lists (only visible rows exist in the DOM) → type to filter first.

---

## 16. Multi-select

**Native `<select multiple>`**

```ts
const skills = page.getByLabel('Skills');
await skills.selectOption([{ label: 'Java' }, { label: 'Python' }]);
await expect(skills).toHaveValues(['java', 'python']); // option VALUES
await skills.selectOption([]);                           // clear all
```

**Custom multi-select with chips/tags**

```html
<input role="combobox" aria-label="Genre(s)" />
<div class="chip">Acid Jazz <button aria-label="Remove">×</button></div>
```

```ts
async function selectMany(page: Page, field: string, values: string[]) {
  await page.getByRole('combobox', { name: field }).click();
  for (const v of values) await page.getByRole('option', { name: v, exact: true }).click();
  await page.keyboard.press('Escape'); // close the list so it does not cover other buttons
}
```

```ts
test('selects several genres', async ({ page }) => {
  await selectMany(page, 'Genre(s)', ['Acid Jazz', 'Blues']);
  await expect(page.getByText('Acid Jazz')).toBeVisible();
  await expect(page.getByText('Blues')).toBeVisible();
});

test('removes a chip', async ({ page }) => {
  await selectMany(page, 'Genre(s)', ['Acid Jazz']);
  await page.locator('.chip', { hasText: 'Acid Jazz' }).getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Acid Jazz')).toBeHidden();
});

test('free-text tags: type and press Enter', async ({ page }) => {
  const similar = page.getByRole('textbox', { name: 'Similar artist(s)' });
  for (const name of ['Adele', 'Coldplay']) {
    await similar.fill(name);
    await similar.press('Enter');
  }
  await expect(page.getByText('Coldplay')).toBeVisible();
});

test('limit of 5 tags', async ({ page }) => {
  const tags = page.getByRole('textbox', { name: 'Tags' });
  for (let i = 1; i <= 6; i++) {
    await tags.fill(`tag${i}`);
    await tags.press('Enter');
  }
  await expect(page.getByText('tag6')).toBeHidden();
});
```

---

## 17. Range slider

**Native `<input type="range">`**

```html
<label for="vol">Volume</label>
<input id="vol" type="range" min="0" max="100" step="5" value="50" />
```

```ts
const volume = page.getByRole('slider', { name: 'Volume' }); // or getByLabel('Volume')
await volume.fill('80');            // set directly (works for type=range)
await volume.press('ArrowRight');   // +step
await volume.press('Home');         // min
await volume.press('End');          // max
```

**Custom slider (div with role="slider")** – use keyboard, or drag with the mouse

```ts
const slider = page.getByRole('slider', { name: 'Price' });
await slider.focus();
for (let i = 0; i < 5; i++) await slider.press('ArrowRight');

// Mouse drag to a percentage of the track
async function dragSliderTo(page: Page, track: Locator, percent: number) {
  const box = (await track.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + (box.width * percent) / 100, y, { steps: 10 });
  await page.mouse.up();
}
```

```ts
test('native slider sets the volume', async ({ page }) => {
  const volume = page.getByRole('slider', { name: 'Volume' });
  await volume.fill('80');
  await expect(volume).toHaveValue('80');
  await expect(page.getByText('Volume: 80')).toBeVisible();
});

test('slider respects min and max', async ({ page }) => {
  const volume = page.getByRole('slider', { name: 'Volume' });
  await volume.press('End');
  await expect(volume).toHaveValue('100');
  await volume.press('Home');
  await expect(volume).toHaveValue('0');
});

test('custom slider moves with the keyboard', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Price' });
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuenow', '11');
});
```

---

## 18. File upload

```html
<input type="file" accept=".png,.jpg" />            <!-- often hidden behind a "Click to upload" box -->
```

```ts
import path from 'path';
const file = path.resolve(process.cwd(), 'src/data/files/avatar.png'); // keep test files in src/data/files

// 1. Input exists in the DOM (even hidden) – most common
await page.locator('input[type="file"]').setInputFiles(file);

// 2. Several files
await page.locator('input[type="file"]').setInputFiles([fileA, fileB]);

// 3. File created in memory – no file on disk needed
await page.locator('input[type="file"]').setInputFiles({
  name: 'notes.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('hello'),
});

// 4. Input is created only after clicking a button → catch the file chooser
const chooserPromise = page.waitForEvent('filechooser');
await page.getByText('Click to upload').click();
await (await chooserPromise).setFiles(file);

// 5. Remove the selected file(s)
await page.locator('input[type="file"]').setInputFiles([]);
```

```ts
test('uploads an avatar and shows a preview', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles('src/data/files/avatar.png');
  await expect(page.getByRole('img', { name: 'Avatar preview' })).toBeVisible();
  await expect(page.getByText('avatar.png')).toBeVisible();
});

test('rejects a wrong file type', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'virus.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x'),
  });
  await expect(page.getByRole('alert')).toContainText('Unsupported file type');
});

test('rejects a file that is too large', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(21 * 1024 * 1024), // 21 MB
  });
  await expect(page.getByText('Max file size: 20 MB')).toBeVisible();
});

test('upload progress reaches 100%', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles('src/data/files/track.wav');
  await expect(page.getByText('100%')).toBeVisible({ timeout: 30_000 }); // big files – longer timeout
});
```

---

## 19. File download

```ts
const downloadPromise = page.waitForEvent('download'); // start waiting BEFORE the click
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

download.suggestedFilename();                                        // "employees.csv"
await download.saveAs(test.info().outputPath(download.suggestedFilename())); // save in test output
```

```ts
import fs from 'fs';

test('exports employees as CSV', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const filePath = test.info().outputPath('export.csv');
  await download.saveAs(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  expect(content.split('\n')[0]).toBe('Name,Email,Department'); // header row
});
```

---

## 20. Drag and drop

```ts
// Simple (HTML5 drag & drop and most libraries)
await page.getByText('Task A').dragTo(page.getByTestId('done-column'));

// Manual – for libraries that need real mouse movement (react-beautiful-dnd, sortable lists)
async function dragManually(page: Page, from: Locator, to: Locator) {
  await from.hover();
  await page.mouse.down();
  await to.hover({ position: { x: 10, y: 10 } });
  await to.hover(); // second move helps libraries detect the drop target
  await page.mouse.up();
}

// Drag a FILE onto a drop zone (no file input) – usually there is a hidden input: use setInputFiles instead
```

```ts
test('moves a task to Done', async ({ page }) => {
  await page.getByText('Task A').dragTo(page.getByTestId('done-column'));
  await expect(page.getByTestId('done-column').getByText('Task A')).toBeVisible();
});

test('reorders a list', async ({ page }) => {
  const items = page.getByRole('listitem');
  await items.nth(0).dragTo(items.nth(2));
  await expect(items.nth(2)).toHaveText('Item 1');
});
```

---

## 21. Links + new tab / popup

```ts
const link = page.getByRole('link', { name: 'Terms' });
await expect(link).toHaveAttribute('href', '/terms');

// Link opens a NEW TAB (target="_blank")
const popupPromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Help center' }).click();
const newTab = await popupPromise;
await newTab.waitForLoadState();
await expect(newTab).toHaveURL(/help/);
await newTab.close();

// Browser back / forward
await page.goBack();
await page.goForward();
```

```ts
test('external link opens in a new tab', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Spotify' });
  await expect(link).toHaveAttribute('target', '_blank');

  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const tab = await popupPromise;
  await expect(tab).toHaveURL(/spotify\.com/);
});

test('mailto link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Support' })).toHaveAttribute('href', /^mailto:/);
});

test('no broken links in the footer', async ({ page, request }) => {
  for (const link of await page.locator('footer a[href^="http"]').all()) {
    const href = (await link.getAttribute('href'))!;
    const res = await request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
});
```

---

## 22. Browser alert / confirm / prompt

Native `window.alert/confirm/prompt` – Playwright **dismisses them automatically** unless you register a handler first.

```ts
// Accept the NEXT dialog (register BEFORE the click)
page.once('dialog', (dialog) => dialog.accept());
await page.getByRole('button', { name: 'Delete' }).click();

// Dismiss (Cancel)
page.once('dialog', (dialog) => dialog.dismiss());

// Prompt with text
page.once('dialog', (dialog) => dialog.accept('My answer'));
```

```ts
test('delete asks for confirmation', async ({ page }) => {
  let message = '';
  page.once('dialog', async (dialog) => {
    message = dialog.message();
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
  });

  await page.getByRole('button', { name: 'Delete' }).click();

  expect(message).toBe('Are you sure you want to delete this employee?');
  await expect(page.getByText('Employee deleted')).toBeVisible();
});

test('cancel keeps the item', async ({ page }) => {
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('row', { name: /Jane Doe/ })).toBeVisible();
});
```

---

## 23. Modal dialog

HTML/JS modals (not native) – treat like a normal part of the page, scoped to `role="dialog"`.

```ts
const dialog = page.getByRole('dialog'); // or getByRole('dialog', { name: 'Discard changes?' })
await dialog.getByRole('button', { name: 'Yes, discard changes' }).click();
await page.keyboard.press('Escape'); // close with ESC
```

```ts
test('discard asks for confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Discard' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Are you sure you want to discard the changes?');

  await dialog.getByRole('button', { name: 'Yes, discard changes' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/artist$/);
});

test('Cancel closes the modal and keeps the form', async ({ page }) => {
  await page.getByLabel('Name').fill('Keep me');
  await page.getByRole('button', { name: 'Discard' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('Keep me');
});

test('ESC closes the modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Open' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
```

---

## 24. Toast / snackbar

```ts
const toast = page.getByRole('alert');                 // or getByRole('status')
await expect(toast).toContainText('Profile updated successfully');
await expect(toast).toBeHidden({ timeout: 10_000 });   // auto-disappears
await toast.getByRole('button', { name: 'Close' }).click();
```

```ts
test('shows a success toast after saving', async ({ page }) => {
  await page.getByRole('button', { name: 'Save' }).click();
  // assert IMMEDIATELY after the action – toasts disappear after a few seconds
  await expect(page.getByRole('alert').filter({ hasText: 'Saved' })).toBeVisible();
});
```

---

## 25. Table

```html
<table>
  <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
  <tbody><tr><td>Jane Doe</td><td>jane@x.com</td><td><button>Edit</button></td></tr></tbody>
</table>
```

```ts
const rows = page.getByRole('row');                                   // includes the header row
const janeRow = page.getByRole('row').filter({ hasText: 'Jane Doe' }); // find a row by text
await janeRow.getByRole('button', { name: 'Edit' }).click();           // action inside the row
const email = await janeRow.getByRole('cell').nth(1).innerText();      // read a cell
const allNames = await page.locator('tbody tr td:nth-child(1)').allInnerTexts(); // a whole column
```

```ts
test('new employee appears in the table', async ({ page }) => {
  const row = page.getByRole('row').filter({ hasText: 'Jane Doe' });
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell').nth(1)).toHaveText('jane@x.com');
});

test('table has the right headers', async ({ page }) => {
  await expect(page.getByRole('columnheader')).toHaveText(['Name', 'Email', 'Actions']);
});

test('sorts by name', async ({ page }) => {
  await page.getByRole('columnheader', { name: 'Name' }).click();
  const names = await page.locator('tbody tr td:nth-child(1)').allInnerTexts();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
});

test('search filters the table', async ({ page }) => {
  await page.getByPlaceholder('Search').fill('Jane');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('pagination', async ({ page }) => {
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('11–20 of')).toBeVisible();
});
```

---

## 26. Lists + counting items

```ts
const items = page.getByRole('listitem');
await expect(items).toHaveCount(5);
await expect(items).toHaveText(['One', 'Two', 'Three', 'Four', 'Five']); // exact order
await expect(items.first()).toHaveText('One');
const texts = await items.allInnerTexts();
for (const item of await items.all()) await expect(item).toBeVisible(); // loop over each
```

```ts
test('adding an item increases the count', async ({ page }) => {
  const items = page.getByRole('listitem');
  const before = await items.count();
  await page.getByRole('button', { name: 'Add item' }).click();
  await expect(items).toHaveCount(before + 1); // toHaveCount retries, count() does not
});

test('empty state', async ({ page }) => {
  await expect(page.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByText('No artists yet')).toBeVisible();
});
```

---

## 27. Tabs + accordion

```ts
// Tabs
await page.getByRole('tab', { name: 'Stats' }).click();
await expect(page.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
await expect(page.getByRole('tabpanel')).toContainText('Plays');

// Accordion (button with aria-expanded)
const section = page.getByRole('button', { name: 'Shipping details' });
await section.click();
await expect(section).toHaveAttribute('aria-expanded', 'true');
await expect(page.getByText('Delivery in 3–5 days')).toBeVisible();
```

---

## 28. Date picker (calendar widget)

```ts
// 1. Easiest: the input accepts typing
await page.getByLabel('Birth date').fill('12/31/1990');
await page.keyboard.press('Escape'); // close the calendar

// 2. Must click through the calendar
async function pickDate(page: Page, field: Locator, date: Date) {
  const target = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // "December 2026"
  await field.click();
  const header = page.locator('.calendar-header'); // the "Month Year" title of your widget
  for (let i = 0; i < 24 && (await header.innerText()) !== target; i++) {
    await page.getByRole('button', { name: 'Next month' }).click();
  }
  await page.getByRole('gridcell', { name: String(date.getDate()), exact: true }).click();
}
```

```ts
test('picks a date from the calendar', async ({ page }) => {
  await pickDate(page, page.getByLabel('Start date'), new Date(2026, 11, 31));
  await expect(page.getByLabel('Start date')).toHaveValue('12/31/2026');
});

test('past dates are disabled', async ({ page }) => {
  await page.getByLabel('Start date').click();
  await expect(page.getByRole('gridcell', { name: '1', exact: true }).first()).toBeDisabled();
});
```

> Tests involving "today"? Freeze time: `await page.clock.setFixedTime(new Date('2026-06-15'))` before `page.goto`.

---

## 29. iframe

```ts
const frame = page.frameLocator('iframe[title="Payment"]'); // or '#stripe-frame'
await frame.getByLabel('Card number').fill('4242 4242 4242 4242');
await frame.getByRole('button', { name: 'Pay' }).click();

// newer style: page.locator('iframe').contentFrame()
const frame2 = page.locator('iframe[title="Payment"]').contentFrame();
```

```ts
test('fills the card inside the payment iframe', async ({ page }) => {
  const frame = page.frameLocator('iframe[title="Payment"]');
  await frame.getByLabel('Card number').fill('4242 4242 4242 4242');
  await expect(frame.getByLabel('Card number')).toHaveValue('4242 4242 4242 4242');
});
```

---

## 30. Keyboard shortcuts

```ts
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');               // move focus
await page.keyboard.press('Shift+Tab');
await page.keyboard.press('Escape');
await page.keyboard.press('ControlOrMeta+A');   // Ctrl on Windows/Linux, Cmd on Mac
await page.keyboard.press('ControlOrMeta+C');
await page.keyboard.press('ControlOrMeta+V');
await page.keyboard.type('Hello');              // type into the focused element
```

```ts
test('Tab order goes email → password → Sign in', async ({ page }) => {
  await page.getByLabel('Email address').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
});

test('Enter submits the form', async ({ page }) => {
  await page.getByLabel('Password', { exact: true }).fill('Secret@123');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dashboard/);
});
```

---

## 31. Scroll + infinite scroll

```ts
await page.getByText('Footer').scrollIntoViewIfNeeded(); // usually NOT needed – actions scroll for you
await page.mouse.wheel(0, 2000);                          // scroll down 2000 px

// Infinite scroll: keep scrolling until the item appears
const target = page.getByText('Artist #120');
for (let i = 0; i < 20 && !(await target.isVisible()); i++) {
  await page.mouse.wheel(0, 3000);
  await page.waitForLoadState('networkidle'); // let the next page load
}
await expect(target).toBeVisible();
```

---

## 32. Wait for / mock API calls

```ts
// 1. Wait for the request an action triggers (and read its response)
const responsePromise = page.waitForResponse(
  (r) => r.url().includes('/api/employees') && r.request().method() === 'POST',
);
await page.getByRole('button', { name: 'Save' }).click();
const response = await responsePromise;
expect(response.status()).toBe(201);
const body = await response.json(); // e.g. capture the new id: body.data.id

// 2. Mock a response (test UI states without a real backend)
await page.route('**/api/employees*', (route) =>
  route.fulfill({ status: 200, json: { data: [], total: 0 } }),
);

// 3. Force an error
await page.route('**/api/employees', (route) => route.fulfill({ status: 500, json: { message: 'Server error' } }));

// 4. Block a request (e.g. analytics, payment)
await page.route('**/google-analytics.com/**', (route) => route.abort());

// 5. Change the real response
await page.route('**/api/profile', async (route) => {
  const res = await route.fetch();
  const json = await res.json();
  json.data.firstname = 'Mocked';
  await route.fulfill({ response: res, json });
});
```

```ts
test('shows an error banner when the API fails', async ({ page }) => {
  await page.route('**/api/employees*', (route) => route.fulfill({ status: 500 }));
  await page.goto('/employees');
  await expect(page.getByRole('alert')).toContainText('Something went wrong');
});

test('shows the empty state', async ({ page }) => {
  await page.route('**/api/employees*', (route) => route.fulfill({ json: { data: [], total: 0 } }));
  await page.goto('/employees');
  await expect(page.getByText('No employees found')).toBeVisible();
});

test('captures the id the UI created', async ({ page }) => {
  const created = page.waitForResponse((r) => r.url().endsWith('/api/employees') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save' }).click();
  const { data } = await (await created).json();
  await expect(page).toHaveURL(new RegExp(`/employees/${data.id}`));
});
```

> Register `page.route()` **before** `page.goto()` / the action that sends the request.
> The framework's `BasePage.actionAndWaitForResponse()` wraps pattern 1.

---

## 33. Form validation pattern (data-driven)

One loop instead of ten copy-pasted tests. Each case gets its own test name in the report.

```ts
const cases = [
  { field: 'Email address', value: '', error: 'Email address is required.' },
  { field: 'Email address', value: 'bad', error: 'Invalid email address.' },
  { field: 'Full name', value: '', error: 'Full name is required.' },
  { field: 'Phone', value: '12ab', error: 'Only digits allowed.' },
];

test.describe('sign-up form validation', () => {
  test.beforeEach(async ({ page }) => page.goto('/signup'));

  for (const { field, value, error } of cases) {
    test(`${field} = "${value}" → ${error}`, async ({ page }) => {
      const input = page.getByLabel(field, { exact: true });
      await input.fill(value);
      await input.blur();
      await expect(page.getByText(error)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign up' })).toBeDisabled();
    });
  }
});
```

Test data from JSON: `import users from '@data/users.json';` then loop over `users`.

---

## 34. Assertions quick list

All `expect(locator)` assertions **retry** until the timeout – no waits needed.

| Assertion | Checks |
|---|---|
| `toBeVisible()` / `toBeHidden()` | shown / not shown (or not in DOM) |
| `toBeAttached()` | exists in DOM (visible or not) |
| `toBeEnabled()` / `toBeDisabled()` | button/input state |
| `toBeEditable()` | input can be typed into |
| `toBeChecked()` / `not.toBeChecked()` | checkbox, radio, switch |
| `toBeFocused()` | has keyboard focus |
| `toBeEmpty()` | input has no value / element has no text |
| `toHaveValue('x')` / `toHaveValues([...])` | input value / multi-select values |
| `toHaveText('x')` / `toHaveText(['a','b'])` | exact text (list = each element, in order) |
| `toContainText('x')` | text contains |
| `toHaveAttribute('href', '/x')` | attribute value |
| `toHaveClass(/active/)` | CSS class |
| `toHaveCSS('color', 'rgb(255, 0, 0)')` | computed style |
| `toHaveCount(3)` | number of matches |
| `toBeInViewport()` | scrolled into view |
| `toHaveScreenshot()` | visual comparison |
| `expect(page).toHaveURL(/dashboard/)` | current URL |
| `expect(page).toHaveTitle('Home')` | tab title |

```ts
await expect(locator).not.toBeVisible();                    // negate any assertion
await expect(locator).toBeVisible({ timeout: 30_000 });     // longer wait for slow things
await expect.soft(locator).toHaveText('x');                 // keep going after failure, report at the end
await expect.poll(async () => (await api.get('/status')).field('state')).toBe('done'); // retry any value
expect(value, 'custom message shown on failure').toBe(5);   // plain value (no retry)
```

---

## 35. Debugging tips

```bash
npx playwright test login --headed            # watch the browser
npx playwright test login --debug             # step through with the inspector
npx playwright test --ui                      # UI mode: time-travel through each step
npx playwright codegen http://localhost:5173  # record actions → generates locators
npx playwright show-trace reports/test-results/<test>/trace.zip   # open a failed test's trace
```

```ts
await page.pause();                         // stop here and open the inspector (remove before commit)
console.log(await locator.count());         // how many elements match?
console.log(await page.locator('main').ariaSnapshot()); // what roles/names does the page expose?
test.only(...)                              // run just this test (ESLint blocks committing it)
test.fixme(...) / test.skip(...)            // temporarily skip
```

**Flaky test checklist**
- No `page.waitForTimeout()` – wait for a visible element, URL or response instead.
- Use web-first assertions (`await expect(locator)...`), not `expect(await locator.isVisible())`.
- Start `waitForResponse` / `waitForEvent` **before** the click that triggers it.
- Unique test data (`faker`, `Date.now()`) so parallel tests don't collide.
- Each test sets up its own state; never depend on another test's leftovers.

---

# Part 2 – Extras every internal app needs

## 36. Multiple users / roles (login once per role)

Internal apps have roles (officer, underwriter, manager, admin). Log in **once per role** in the setup project and reuse the session.

```bash
# env/.env.local
OFFICER_EMAIL=officer@bank.test
OFFICER_PASSWORD=...
UNDERWRITER_EMAIL=underwriter@bank.test
UNDERWRITER_PASSWORD=...
MANAGER_EMAIL=manager@bank.test
MANAGER_PASSWORD=...
```

```ts
// src/config/env.config.ts – add to config
roles: {
  officer: { email: read('OFFICER_EMAIL'), password: read('OFFICER_PASSWORD') },
  underwriter: { email: read('UNDERWRITER_EMAIL'), password: read('UNDERWRITER_PASSWORD') },
  manager: { email: read('MANAGER_EMAIL'), password: read('MANAGER_PASSWORD') },
},
```

```ts
// src/config/roles.ts – one session file per role
import path from 'path';
export type Role = 'officer' | 'underwriter' | 'manager';
export const authFile = (role: Role) => path.resolve(process.cwd(), `.auth/${role}.json`);
```

```ts
// tests/setup/auth.setup.ts – logs in every role, saves each session
import { test as setup, expect } from '@playwright/test';
import { config } from '@config/env.config';
import { authFile, Role } from '@config/roles';

for (const role of Object.keys(config.roles) as Role[]) {
  setup(`login as ${role}`, async ({ page }) => {
    const { email, password } = config.roles[role];
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.context().storageState({ path: authFile(role) });
  });
}
```

```ts
// In a spec: whole file / describe runs as one role
test.use({ storageState: authFile('underwriter') });

// Two roles in ONE test (e.g. maker–checker, see section 44)
test('two users', async ({ browser }) => {
  const officer = await (await browser.newContext({ storageState: authFile('officer') })).newPage();
  const manager = await (await browser.newContext({ storageState: authFile('manager') })).newPage();
  // ... act as each one; close both contexts at the end
});
```

```ts
// Role-based access – data-driven
const access = [
  { role: 'officer', canSee: 'New application', cannotSee: 'Approve' },
  { role: 'manager', canSee: 'Approve', cannotSee: 'Admin settings' },
] as const;

for (const { role, canSee, cannotSee } of access) {
  test.describe(`${role} permissions`, () => {
    test.use({ storageState: authFile(role) });
    test(`${role} sees "${canSee}" but not "${cannotSee}"`, async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.getByRole('button', { name: canSee })).toBeVisible();
      await expect(page.getByRole('button', { name: cannotSee })).toBeHidden();
    });
  });
}

test.describe('direct URL is blocked', () => {
  test.use({ storageState: authFile('officer') });
  test('officer cannot open the admin page by URL', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByText(/access denied|403|not authori[sz]ed/i)).toBeVisible();
  });
});
```

## 37. Session timeout, logout, browser storage

```ts
test('logout clears the session', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
});

test('session expires after inactivity', async ({ page }) => {
  await page.clock.install();                 // control time BEFORE goto
  await page.goto('/dashboard');
  await page.clock.fastForward('16:00');      // 16 minutes
  await expect(page.getByText('Your session has expired')).toBeVisible();
});

// Read / change storage and cookies
const token = await page.evaluate(() => localStorage.getItem('token'));
await page.evaluate(() => localStorage.removeItem('token'));
const cookies = await page.context().cookies();
await page.context().clearCookies();
```

## 38. Accessibility check (axe)

```bash
npm install -D @axe-core/playwright
```

```ts
import AxeBuilder from '@axe-core/playwright';

test('application form has no serious a11y issues', async ({ page }) => {
  await page.goto('/applications/new');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
  expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
});
```

## 39. Visual check, mobile view, offline, permissions

```ts
// Visual: first run creates the baseline image, later runs compare against it
await expect(page).toHaveScreenshot('dashboard.png', { mask: [page.getByTestId('today-date')] });

// Mobile / tablet layout
test.use({ ...devices['iPhone 13'] });        // import { devices } from '@playwright/test'
test.use({ viewport: { width: 768, height: 1024 } });

// Offline / slow network
await page.context().setOffline(true);
await expect(page.getByText('You are offline')).toBeVisible();

// Browser permissions (camera for KYC selfie, location, clipboard)
test.use({ permissions: ['camera', 'geolocation'], geolocation: { latitude: 19.07, longitude: 72.87 } });
```

## 40. Hybrid: create data by API, check it in the UI

UI tests are slow – create preconditions through the API and use the UI only for what you are testing.

```ts
test('underwriter sees an application created by API', async ({ page, request, cleanup }) => {
  const api = new ApiClient(request).setToken(await getToken(request, 'officer'));
  const res = await api.post('/applications', { body: buildLoanApplication() });
  await expect(res).toHaveStatus(201);
  const id = res.field<string>('data.id');
  cleanup.add(`delete application ${id}`, () => api.delete(`/applications/${id}`));

  await page.goto(`/applications/${id}`);
  await expect(page.getByRole('heading', { name: `Application #${id}` })).toBeVisible();
});
```

---

# Part 3 – Loan application (internal team) – what to test and how

Typical internal loan app: **loan officers** enter applications, **underwriters** review them,
**managers** approve, **ops** disburse. Everything below plugs into the framework.

**Suggested files**

```
src/
├── config/roles.ts                         # role → session file (section 36)
├── core/utils/
│   ├── money.ts                            # parse/format currency, EMI, schedule (sections 42–43)
│   └── validators.ts                       # email, PAN, Aadhaar, SSN, phone, IFSC… (section 41)
├── data/
│   ├── loanFactory.ts                      # buildLoanApplication() with faker (section 49)
│   └── files/                              # id-proof.pdf, salary-slip.pdf, too-big.pdf…
├── api/services/LoanService.ts             # create / submit / approve / delete via API
└── pages/loan/
    ├── LoanListPage.ts                     # search, filters, status chips
    ├── LoanApplicationPage.ts              # multi-step wizard
    ├── LoanReviewPage.ts                   # underwriter / manager actions
    └── components/{EmiCalculator,DocumentUpload,StatusBadge,AuditTrail}.ts
tests/
├── setup/auth.setup.ts                     # one session per role
├── api/loan.api.spec.ts                    # rules + status transitions via API (fast)
├── ui/loan-application.ui.spec.ts          # form, validation, calculator, uploads
├── ui/loan-roles.ui.spec.ts                # role-based access
└── e2e/loan-lifecycle.e2e.spec.ts          # draft → submit → review → approve → disburse
```

## 41. Identity & masked fields (PAN, Aadhaar, SSN, phone, IFSC)

```ts
// src/core/utils/validators.ts
export const Patterns = {
  pan: /^[A-Z]{5}\d{4}[A-Z]$/,               // ABCDE1234F            (India)
  aadhaar: /^\d{4}\s?\d{4}\s?\d{4}$/,        // 1234 5678 9012        (India)
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,            // HDFC0001234           (India)
  ssn: /^\d{3}-\d{2}-\d{4}$/,                // 123-45-6789           (US)
  phoneIn: /^[6-9]\d{9}$/,                   // 9876543210
  phoneUs: /^\(\d{3}\) \d{3}-\d{4}$/,        // (555) 123-4567
  zipUs: /^\d{5}(-\d{4})?$/,
  pinIn: /^[1-9]\d{5}$/,
};
export const matches = (kind: keyof typeof Patterns, value: string) => Patterns[kind].test(value);

/** Masked display, e.g. "XXXX XXXX 9012" – show only the last 4 */
export const lastFour = (value: string) => value.replace(/\D/g, '').slice(-4);
```

```ts
const invalidPan = ['abcde1234f', 'ABCD1234F', 'ABCDE12345', 'ABCDE1234'];
for (const value of invalidPan) {
  test(`rejects PAN "${value}"`, async ({ page }) => {
    const pan = page.getByLabel('PAN');
    await pan.fill(value);
    await pan.blur();
    await expect(page.getByText('Enter a valid PAN')).toBeVisible();
  });
}

test('PAN is upper-cased automatically', async ({ page }) => {
  await page.getByLabel('PAN').pressSequentially('abcde1234f'); // masks react to key presses, not fill()
  await expect(page.getByLabel('PAN')).toHaveValue('ABCDE1234F');
});

test('phone input mask formats the number', async ({ page }) => {
  await page.getByLabel('Phone').pressSequentially('5551234567');
  await expect(page.getByLabel('Phone')).toHaveValue('(555) 123-4567');
});

test('Aadhaar is masked on the summary page (only last 4 visible)', async ({ page }) => {
  await expect(page.getByTestId('aadhaar')).toHaveText('XXXX XXXX 9012');
  await expect(page.locator('body')).not.toContainText('1234 5678 9012'); // full number never shown
});

test('sensitive data is not in the URL', async ({ page }) => {
  expect(page.url()).not.toMatch(/\d{12}|[A-Z]{5}\d{4}[A-Z]/);
});

test('date of birth: applicant must be 18+', async ({ page }) => {
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 17);
  await page.getByLabel('Date of birth').fill(dob.toISOString().slice(0, 10));
  await page.getByLabel('Date of birth').blur();
  await expect(page.getByText('Applicant must be at least 18 years old')).toBeVisible();
});
```

## 42. Money fields – amount, currency format, rounding

```ts
// src/core/utils/money.ts
/** "₹1,00,000.50" / "$100,000.50" / "1 00 000" → 100000.5 */
export const parseAmount = (text: string): number => Number(text.replace(/[^\d.-]/g, ''));

/** 100000 → "₹1,00,000.00" (en-IN) or "$100,000.00" (en-US) */
export const formatAmount = (value: number, currency = 'INR', locale = 'en-IN') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
```

```ts
test('loan amount is formatted with separators', async ({ page }) => {
  const amount = page.getByLabel('Loan amount');
  await amount.pressSequentially('500000');
  await amount.blur();
  await expect(amount).toHaveValue('5,00,000'); // or '500,000' – whatever your locale shows
});

// Boundary values: just below min, min, max, just above max
const amountCases = [
  { value: '49999', error: 'Minimum loan amount is ₹50,000' },
  { value: '50000', error: null },
  { value: '5000000', error: null },
  { value: '5000001', error: 'Maximum loan amount is ₹50,00,000' },
  { value: '-1000', error: 'Enter a valid amount' },
  { value: '1000.555', error: 'Maximum 2 decimal places' },
];
for (const { value, error } of amountCases) {
  test(`loan amount ${value} → ${error ?? 'accepted'}`, async ({ page }) => {
    const amount = page.getByLabel('Loan amount');
    await amount.fill(value);
    await amount.blur();
    if (error) await expect(page.getByText(error)).toBeVisible();
    else await expect(page.getByRole('alert')).toBeHidden();
  });
}
```

## 43. EMI calculator + repayment schedule

```ts
// src/core/utils/money.ts (continued)
/** Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate */
export function calculateEmi(principal: number, annualRatePct: number, months: number): number {
  if (annualRatePct === 0) return round2(principal / months);
  const r = annualRatePct / 12 / 100;
  const f = Math.pow(1 + r, months);
  return round2((principal * r * f) / (f - 1));
}

export type ScheduleRow = { month: number; emi: number; interest: number; principal: number; balance: number };

/** Month-by-month schedule; the last row absorbs rounding so the balance ends at 0 */
export function amortizationSchedule(principal: number, annualRatePct: number, months: number): ScheduleRow[] {
  const r = annualRatePct / 12 / 100;
  const emi = calculateEmi(principal, annualRatePct, months);
  const rows: ScheduleRow[] = [];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const interest = round2(balance * r);
    const principalPart = month === months ? balance : round2(emi - interest);
    balance = round2(balance - principalPart);
    rows.push({ month, emi: round2(principalPart + interest), interest, principal: principalPart, balance });
  }
  return rows;
}
```

```ts
import { calculateEmi, amortizationSchedule, parseAmount } from '@core/utils/money';

test('EMI helper matches a known value', () => {
  expect(calculateEmi(100000, 10, 12)).toBeCloseTo(8791.59, 2); // ₹1,00,000 @ 10% for 12 months
});

// UI calculator shows the same EMI as the formula
const emiCases = [
  { amount: 100000, rate: 10, months: 12 },
  { amount: 500000, rate: 8.5, months: 60 },
  { amount: 2500000, rate: 9.25, months: 240 },
  { amount: 100000, rate: 0, months: 10 },      // 0% promo loan
];
for (const { amount, rate, months } of emiCases) {
  test(`EMI for ${amount} @ ${rate}% × ${months}m`, async ({ page }) => {
    await page.getByLabel('Loan amount').fill(String(amount));
    await page.getByLabel('Interest rate').fill(String(rate));
    await page.getByLabel('Tenure (months)').fill(String(months));

    const expected = calculateEmi(amount, rate, months);
    // expect.poll retries – the UI may recalculate after a debounce
    await expect.poll(async () => parseAmount(await page.getByTestId('emi-value').innerText())).toBeCloseTo(expected, 0);
  });
}

test('tenure slider updates the EMI', async ({ page }) => {
  const emi = page.getByTestId('emi-value');
  const before = await emi.innerText();
  await page.getByRole('slider', { name: 'Tenure' }).fill('120');
  await expect(emi).not.toHaveText(before);
});

test('repayment schedule is consistent', async ({ page }) => {
  const [amount, rate, months] = [500000, 8.5, 24];
  // ... fill the form and open the schedule
  const rows = page.locator('table#schedule tbody tr');
  await expect(rows).toHaveCount(months);                              // one row per month

  const principals = (await rows.locator('td:nth-child(4)').allInnerTexts()).map(parseAmount);
  const total = principals.reduce((a, b) => a + b, 0);
  expect(total).toBeCloseTo(amount, 0);                                // principal parts add up to the loan
  await expect(rows.last().locator('td').last()).toHaveText(/^₹?0(\.00)?$/); // ends at zero balance

  const expected = amortizationSchedule(amount, rate, months);
  expect(parseAmount(await rows.first().locator('td:nth-child(3)').innerText())).toBeCloseTo(expected[0].interest, 0);
});
```

## 44. Eligibility rules (income, DTI, credit score, age)

Business rules are best tested via **API** (fast, many cases) plus a few UI checks for the messages.

```ts
// Debt-to-income: existing EMIs + new EMI must stay under 50% of monthly income
export const dti = (monthlyIncome: number, existingEmis: number, newEmi: number) =>
  round2(((existingEmis + newEmi) / monthlyIncome) * 100);
```

```ts
const eligibility = [
  { case: 'good applicant', income: 100000, score: 780, age: 30, existing: 0, expected: 'Eligible' },
  { case: 'score just below cut-off', income: 100000, score: 649, age: 30, existing: 0, expected: 'Not eligible' },
  { case: 'score at cut-off', income: 100000, score: 650, age: 30, existing: 0, expected: 'Eligible' },
  { case: 'too young', income: 100000, score: 780, age: 17, existing: 0, expected: 'Not eligible' },
  { case: 'retires before loan ends', income: 100000, score: 780, age: 58, existing: 0, expected: 'Not eligible' },
  { case: 'DTI above 50%', income: 40000, score: 780, age: 30, existing: 15000, expected: 'Not eligible' },
];

for (const c of eligibility) {
  test(`eligibility: ${c.case}`, async ({ loanApi }) => {
    const res = await loanApi.checkEligibility({ ...c, amount: 500000, tenureMonths: 60 });
    await expect(res).toHaveStatus(200);
    await expect(res).toHaveField('data.result', c.expected);
  });
}

test('UI explains why the applicant is not eligible', async ({ page }) => {
  // ... fill with credit score 600
  await page.getByRole('button', { name: 'Check eligibility' }).click();
  await expect(page.getByRole('alert')).toContainText('Credit score below 650');
});
```

## 45. Multi-step application wizard (save draft, resume, back/next)

```ts
test.describe('new loan application', () => {
  test.use({ storageState: authFile('officer') });

  test('each step blocks Next until required fields are filled', async ({ page }) => {
    await page.goto('/applications/new');
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
    // fill step 1 …
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  test('progress bar / stepper shows the current step', async ({ page }) => {
    await expect(page.getByRole('listitem', { name: 'Applicant details' })).toHaveAttribute('aria-current', 'step');
  });

  test('save as draft and resume later', async ({ page }) => {
    await page.getByLabel('First name').fill('Draft');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('alert')).toContainText('Draft saved');
    const id = page.url().match(/applications\/(\w+)/)![1];

    await page.goto('/applications?status=Draft');
    await page.getByRole('row').filter({ hasText: id }).getByRole('link', { name: 'Continue' }).click();
    await expect(page.getByLabel('First name')).toHaveValue('Draft');
  });

  test('leaving with unsaved changes warns the user', async ({ page }) => {
    await page.getByLabel('First name').fill('Unsaved');
    page.once('dialog', (d) => d.dismiss());                  // native "Leave site?" (beforeunload)
    await page.goto('/dashboard').catch(() => {});
    await expect(page).toHaveURL(/applications\/new/);
  });

  test('review step shows everything entered', async ({ page }) => {
    // ... complete all steps
    await expect(page.getByTestId('summary-loan-amount')).toHaveText('₹5,00,000.00');
    await expect(page.getByTestId('summary-emi')).toHaveText(formatAmount(calculateEmi(500000, 8.5, 60)));
  });

  test('Edit from the review step jumps back to that step', async ({ page }) => {
    await page.getByRole('button', { name: 'Edit income details' }).click();
    await expect(page.getByRole('heading', { name: 'Income details' })).toBeVisible();
  });
});
```

## 46. KYC & income documents

```ts
const docs = {
  idProof: 'src/data/files/id-proof.pdf',
  salarySlip: 'src/data/files/salary-slip.pdf',
  bankStatement: 'src/data/files/bank-statement.pdf',
};

test('uploads all required documents', async ({ page }) => {
  for (const [type, file] of Object.entries(docs)) {
    await page.getByTestId(`upload-${type}`).locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByTestId(`upload-${type}`)).toContainText('Uploaded');
  }
  await expect(page.getByRole('button', { name: 'Submit application' })).toBeEnabled();
});

test('submit is blocked while a mandatory document is missing', async ({ page }) => {
  await page.getByTestId('upload-idProof').locator('input[type="file"]').setInputFiles(docs.idProof);
  await expect(page.getByRole('button', { name: 'Submit application' })).toBeDisabled();
  await expect(page.getByText('Salary slip is required')).toBeVisible();
});

test('rejects wrong type and oversized files', async ({ page }) => {
  const input = page.getByTestId('upload-idProof').locator('input[type="file"]');
  await input.setInputFiles({ name: 'id.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
  await expect(page.getByRole('alert')).toContainText('Only PDF, JPG, PNG');
  await input.setInputFiles({ name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(11 * 1024 * 1024) });
  await expect(page.getByRole('alert')).toContainText('Maximum 10 MB');
});

test('underwriter can view and reject a document with a reason', async ({ page }) => {
  await page.getByRole('row').filter({ hasText: 'Salary slip' }).getByRole('button', { name: 'Reject' }).click();
  await page.getByRole('dialog').getByLabel('Reason').fill('Document is blurred');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Salary slip' })).toContainText('Rejected');
});
```

## 47. Status workflow, maker–checker, audit trail

```
Draft → Submitted → Under review → (More info needed ↺) → Approved → Disbursed
                                 ↘ Rejected
```

```ts
test.describe('loan lifecycle', () => {
  test('officer submits → underwriter recommends → manager approves', async ({ browser }) => {
    const as = async (role: Role) =>
      (await browser.newContext({ storageState: authFile(role) })).newPage();

    // 1. Officer creates and submits
    const officer = await as('officer');
    // ... fill application (or create via API, section 40)
    await officer.getByRole('button', { name: 'Submit application' }).click();
    await expect(officer.getByTestId('status')).toHaveText('Submitted');
    const id = officer.url().match(/applications\/(\w+)/)![1];

    // 2. Underwriter reviews
    const underwriter = await as('underwriter');
    await underwriter.goto(`/applications/${id}`);
    await underwriter.getByRole('button', { name: 'Recommend for approval' }).click();
    await expect(underwriter.getByTestId('status')).toHaveText('Under review');

    // 3. Manager approves
    const manager = await as('manager');
    await manager.goto(`/applications/${id}`);
    await manager.getByRole('button', { name: 'Approve' }).click();
    await manager.getByRole('dialog').getByLabel('Comment').fill('Approved – good credit history');
    await manager.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await expect(manager.getByTestId('status')).toHaveText('Approved');

    // 4. Officer sees the new status (reload – or wait for live update)
    await officer.reload();
    await expect(officer.getByTestId('status')).toHaveText('Approved');

    for (const p of [officer, underwriter, manager]) await p.context().close();
  });

  test('maker cannot approve their own application (4-eyes rule)', async ({ page }) => {
    // logged in as the officer who created it
    await expect(page.getByRole('button', { name: 'Approve' })).toBeHidden();
  });

  test('approved application cannot be edited', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Edit' })).toBeDisabled();
    await expect(page.getByLabel('Loan amount')).not.toBeEditable();
  });

  test('reject requires a reason', async ({ page }) => {
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Rejection reason is required')).toBeVisible();
  });

  test('audit trail records every action', async ({ page }) => {
    const trail = page.getByTestId('audit-trail').getByRole('listitem');
    await expect(trail).toHaveText([/Created by officer/, /Submitted/, /Recommended by underwriter/, /Approved by manager/]);
  });

  test('invalid transitions are blocked by the API', async ({ loanApi }) => {
    const res = await loanApi.disburse('id-of-a-draft-application'); // Draft → Disbursed not allowed
    await expect(res).toHaveStatus(409);
  });
});
```

## 48. Loan list – search, filters, export, sanction letter PDF

```ts
test('filter by status', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Approved' });
  for (const badge of await page.getByTestId('status').all()) await expect(badge).toHaveText('Approved');
});

test('search by applicant name or application id', async ({ page }) => {
  await page.getByPlaceholder('Search').fill('APP-1024');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('filter by date range', async ({ page }) => {
  await page.getByLabel('From').fill('2026-01-01');
  await page.getByLabel('To').fill('2026-01-31');
  await page.getByRole('button', { name: 'Apply' }).click();
  const dates = await page.locator('tbody td.created-date').allInnerTexts();
  for (const d of dates) expect(new Date(d) >= new Date('2026-01-01')).toBe(true);
});

test('filters are kept in the URL (shareable)', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Rejected' });
  await expect(page).toHaveURL(/status=Rejected/);
});

test('download sanction letter PDF', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sanction letter' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/sanction.*\.pdf$/i);
  // PDF text check: npm i -D pdf-parse → const text = (await pdf(fs.readFileSync(path))).text
});
```

## 49. Test data builder (unique, realistic, no collisions)

```ts
// src/data/loanFactory.ts
import { faker } from '@faker-js/faker';

export type LoanApplication = {
  firstName: string; lastName: string; email: string; phone: string; dob: string;
  pan: string; monthlyIncome: number; employer: string;
  amount: number; rate: number; tenureMonths: number; purpose: string;
};

const randomPan = () =>
  faker.string.alpha({ length: 5, casing: 'upper' }) + faker.string.numeric(4) + faker.string.alpha({ length: 1, casing: 'upper' });

/** Valid by default; override only what the test is about: buildLoanApplication({ amount: 49999 }) */
export function buildLoanApplication(overrides: Partial<LoanApplication> = {}): LoanApplication {
  const firstName = faker.person.firstName();
  return {
    firstName,
    lastName: `QA${faker.string.alpha(5)}`,                     // easy to find & clean up test data
    email: `qa.${Date.now()}.${faker.string.alphanumeric(4)}@example.com`.toLowerCase(),
    phone: `9${faker.string.numeric(9)}`,
    dob: faker.date.birthdate({ min: 25, max: 45, mode: 'age' }).toISOString().slice(0, 10),
    pan: randomPan(),
    monthlyIncome: faker.number.int({ min: 60000, max: 250000 }),
    employer: faker.company.name(),
    amount: faker.number.int({ min: 100000, max: 2000000, multipleOf: 1000 }),
    rate: 8.5,
    tenureMonths: faker.helpers.arrayElement([12, 24, 36, 60]),
    purpose: 'Home renovation',
    ...overrides,
  };
}
```

## 50. Loan app test checklist

| Area | Must cover |
|---|---|
| **Access** | login per role, menu/buttons per role, direct-URL blocking, logout, session timeout |
| **Applicant data** | required fields, PAN/Aadhaar/SSN/phone/email formats, masks, DOB 18+, duplicates (same PAN twice) |
| **Money** | min/max/boundary amounts, decimals, negative, currency format, rounding |
| **Calculator** | EMI = formula for several cases, 0% rate, slider updates, schedule rows/total/last balance |
| **Eligibility** | score cut-offs (at, above, below), income, DTI, age at start & end of tenure, clear rejection reasons |
| **Wizard** | Next disabled until valid, Back keeps data, draft save & resume, unsaved-changes warning, review = entered data |
| **Documents** | all mandatory present, type/size limits, preview, reject with reason, re-upload |
| **Workflow** | every allowed transition, invalid transitions blocked (API 4xx), maker ≠ checker, locked after approval, reasons required |
| **Audit & notifications** | audit trail entries with user + time, status emails/SMS (check via API or a mail catcher like Mailpit) |
| **List & reports** | search, filters (status/date/officer), sort, pagination, filters in URL, CSV export, sanction-letter PDF |
| **Security / PII** | sensitive data masked, never in URL/logs, no access to other branches' loans, API needs auth |
| **Quality** | accessibility (axe), mobile/tablet layout, API errors show friendly messages, slow network/offline |
| **Concurrency** | two users editing the same application → conflict message, double-click Submit creates only one |

```ts
test('double-click Submit creates only one application', async ({ page }) => {
  let posts = 0;
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith('/applications')) posts++; });
  await page.getByRole('button', { name: 'Submit application' }).dblclick();
  await expect(page.getByTestId('status')).toHaveText('Submitted');
  expect(posts).toBe(1);
});

test('two officers editing the same application → conflict', async ({ browser }) => {
  const a = await (await browser.newContext({ storageState: authFile('officer') })).newPage();
  const b = await (await browser.newContext({ storageState: authFile('officer') })).newPage();
  await a.goto('/applications/APP-1024/edit');
  await b.goto('/applications/APP-1024/edit');
  await a.getByLabel('Loan amount').fill('600000');
  await a.getByRole('button', { name: 'Save' }).click();
  await b.getByLabel('Loan amount').fill('700000');
  await b.getByRole('button', { name: 'Save' }).click();
  await expect(b.getByRole('alert')).toContainText(/modified by another user/i);
});
```
