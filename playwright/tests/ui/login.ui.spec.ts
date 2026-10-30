import { test, expect } from '@fixtures/index';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';

// Login tests must start logged out, so ignore the saved session from the setup project
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', { tag: Tag.auth }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.expectLoaded();
  });

  test.describe('success', () => {
    test(
      'valid credentials land on the dashboard',
      { tag: Tag.smoke },
      async ({ loginPage, dashboardPage, page }) => {
        await loginPage.login(config.user.email, config.user.password);

        await dashboardPage.expectLoggedInAs(config.user.username);
        await expect(
          page.getByRole('status').filter({ hasText: `Welcome back, ${config.user.username}!` }),
        ).toBeVisible();
      },
    );

    test('"Remember me" sets a persistent session cookie', async ({ loginPage, dashboardPage, context }) => {
      await loginPage.login(config.user.email, config.user.password, true);
      await dashboardPage.expectLoggedInAs(config.user.username);

      const cookie = (await context.cookies()).find((c) => c.name === 'wf_token');
      expect(cookie, 'wf_token cookie should be set').toBeDefined();
      expect(cookie!.httpOnly).toBe(true);
      expect(cookie!.expires).toBeGreaterThan(Date.now() / 1000); // -1 would mean a session cookie
    });

    test('protected page redirects to login and back after logging in', async ({ loginPage, page }) => {
      await page.goto('/employees');
      await expect(page).toHaveURL(/\/login\?redirect=%2Femployees/);

      await loginPage.login(config.user.email, config.user.password);
      await expect(page).toHaveURL(/\/employees$/);
    });
  });

  test.describe('failure', { tag: Tag.negative }, () => {
    test('wrong password shows an error and stays on login', async ({ loginPage, page }) => {
      await loginPage.login(config.user.email, 'WrongPassword1');

      await loginPage.expectError('Invalid email or password');
      await expect(page).toHaveURL(/\/login/);
    });

    test('unregistered email shows the same generic error', async ({ loginPage }) => {
      await loginPage.login(`nobody.${Date.now()}@example.com`, 'Test@12345');

      await loginPage.expectError('Invalid email or password');
    });

    test('empty form shows required-field errors', async ({ loginPage }) => {
      await loginPage.click(loginPage.submitButton);

      await loginPage.expectFieldError(loginPage.emailInput, 'Email is required');
      await loginPage.expectFieldError(loginPage.passwordInput, 'Password is required');
    });

    test('invalid email format is rejected before calling the API', async ({ loginPage, page }) => {
      let loginCalled = false;
      page.on('request', (r) => {
        if (r.url().includes('/api/auth/login')) loginCalled = true;
      });

      await loginPage.login('not-an-email', 'Test@12345');

      await loginPage.expectFieldError(loginPage.emailInput, 'Enter a valid email address');
      expect(loginCalled).toBe(false);
    });
  });
});
