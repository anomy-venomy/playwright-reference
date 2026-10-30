import { test, expect } from '@fixtures/auddia.fixture';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';

test.describe('Auddia login & logout (UI only)', { tag: Tag.auth }, () => {
  // The auddia project opens every browser logged in – start these tests logged out instead
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {//loginPage
    await loginPage.open(); //loginPage
    await loginPage.expectLoaded();
  });

  test('keeps Sign in disabled while the form is empty', async ({ loginPage }) => {
    await expect(loginPage.emailInput).toBeEmpty();
    await expect(loginPage.passwordInput).toBeEmpty();
    await expect(loginPage.signInButton).toBeDisabled();
  });

  test('shows required messages for empty fields', { tag: Tag.negative }, async ({ loginPage }) => {
    await loginPage.touchFields();

    await loginPage.expectFieldError('Email address is required.');
    await loginPage.expectFieldError('Password is required.');
    await expect(loginPage.signInButton).toBeDisabled();
  });

  test('rejects an invalid email format', { tag: Tag.negative }, async ({ loginPage }) => {
    await loginPage.fill(loginPage.emailInput, 'not-an-email');
    await loginPage.click(loginPage.passwordInput); // leave the field to trigger validation

    await loginPage.expectFieldError('Invalid email address.');
    await expect(loginPage.signInButton).toBeDisabled();
  });

  test('lets the user type in and clear both fields', async ({ loginPage }) => {
    await loginPage.fill(loginPage.emailInput, config.auddia.email);
    await loginPage.fill(loginPage.passwordInput, 'Any@1234');

    await expect(loginPage.emailInput).toHaveValue(config.auddia.email);
    await expect(loginPage.passwordInput).toHaveValue('Any@1234');
    await expect(loginPage.signInButton).toBeEnabled();

    // Clearing a required field disables Sign in again
    await loginPage.passwordInput.clear();
    await expect(loginPage.signInButton).toBeDisabled();
  });

  test('shows and hides the password', async ({ loginPage }) => {
    await loginPage.fill(loginPage.passwordInput, 'Secret@123');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.click(loginPage.showPasswordButton);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    // After the first click the same button is named "Hide Password"
    await loginPage.click(loginPage.hidePasswordButton);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('shows an error toast for a wrong password', { tag: Tag.negative }, async ({ page, loginPage }) => {
    await loginPage.login(config.auddia.email, 'Wrong@123');

    await loginPage.toast.expectMessage('The user credentials are invalid.');
    await expect(page).toHaveURL(/\/login/); // still on the login page
  });

  test(
    'logs in with valid credentials and shows a success toast',
    { tag: Tag.smoke },
    async ({ page, loginPage, dashboardPage }) => {
      await loginPage.login(config.auddia.email, config.auddia.password);

      await loginPage.toast.expectMessage('Login successful!'); // check first – the toast is gone after ~4 s
      await expect(page).toHaveURL(/\/dashboard/);
      await dashboardPage.expectLoaded();
    },
  );

  test('signs out and ends the session', async ({ page, loginPage, dashboardPage }) => {
    await loginPage.login(config.auddia.email, config.auddia.password);
    await dashboardPage.expectLoaded();

    await dashboardPage.signOut();

    await loginPage.expectLoaded();
    // The app forgets the token in the browser (there is no logout API)
    expect(await page.evaluate(() => localStorage.getItem('dsc_token'))).toBeNull();

    // Proof the session is really gone: a protected page sends us back to login
    await dashboardPage.open();
    await loginPage.expectLoaded();
  });
});
