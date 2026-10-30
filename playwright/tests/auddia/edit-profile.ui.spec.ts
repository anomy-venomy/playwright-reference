import { faker } from '@faker-js/faker';
import { test, expect } from '@fixtures/auddia.fixture';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';

test.describe('Auddia edit profile (UI only)', { tag: Tag.regression }, () => {
  // All tests share ONE account: run them one after another, or the save test
  // changes the name while another test is still reading it
  test.describe.configure({ mode: 'default' });

  // Start logged out and log in through the form, exactly like a real user
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage, dashboardPage, myProfilePage, editProfilePage }) => {
    await loginPage.open();
    await loginPage.login(config.auddia.email, config.auddia.password);
    await dashboardPage.expectLoaded();

    // Reach the form the way a user does: Settings → Edit profile
    await dashboardPage.openSettings();
    await myProfilePage.expectLoaded();
    await myProfilePage.openEditProfile();
    await editProfilePage.expectLoaded();
  });

  test('shows the saved profile in the form', async ({ editProfilePage }) => {
    await expect(editProfilePage.firstNameInput).not.toBeEmpty();
    await expect(editProfilePage.lastNameInput).not.toBeEmpty();
    await expect(editProfilePage.emailInput).toHaveValue(config.auddia.email);
  });

  test('enables Update profile only when something changed', async ({ editProfilePage }) => {
    const original = await editProfilePage.firstNameInput.inputValue();
    await expect(editProfilePage.updateButton).toBeDisabled();

    await editProfilePage.fill(editProfilePage.firstNameInput, `${original}x`);
    await expect(editProfilePage.updateButton).toBeEnabled();

    // Typing the saved value back means nothing changed – disabled again
    await editProfilePage.fill(editProfilePage.firstNameInput, original);
    await expect(editProfilePage.updateButton).toBeDisabled();
  });

  test(
    'shows required messages when fields are empty',
    {tag: [Tag.smoke, Tag.negative] },
    async ({ editProfilePage }) => {
      await editProfilePage.clearAllFields();

      await editProfilePage.expectFieldError('First name is required.');
      await editProfilePage.expectFieldError('Last name is required.');
      await editProfilePage.expectFieldError('Email address is required.');
      await expect(editProfilePage.updateButton).toBeDisabled();
    },
  );

  test('rejects an invalid email format', { tag: Tag.negative }, async ({ editProfilePage }) => {
    await editProfilePage.fill(editProfilePage.emailInput, 'not-an-email');
    await editProfilePage.click(editProfilePage.firstNameInput); // leave the field to trigger validation

    await editProfilePage.expectFieldError('Invalid email address.');
    await expect(editProfilePage.updateButton).toBeDisabled();
  });

  test('Cancel discards unsaved changes', async ({ myProfilePage, editProfilePage }) => {
    const original = await editProfilePage.firstNameInput.inputValue();
    await editProfilePage.fill(editProfilePage.firstNameInput, 'NotSaved');

    await editProfilePage.cancel();
    await myProfilePage.expectLoaded();

    // Re-open the form: the old value is still there
    await myProfilePage.openEditProfile();
    await editProfilePage.expectLoaded();
    await expect(editProfilePage.firstNameInput).toHaveValue(original);
  });

  test('Back to my profile leaves the form', async ({ page, myProfilePage, editProfilePage }) => {
    await editProfilePage.click(editProfilePage.backLink);

    await expect(page).toHaveURL(/\/settings\/my-profile/);
    await myProfilePage.expectLoaded();
  });

  test.describe('saving', () => {
    let originalFirstName = '';

    // Put the original name back through the UI, so every run starts from the same data
    test.afterEach(async ({ editProfilePage }) => {
      if (!originalFirstName) return;
      await editProfilePage.open();
      await editProfilePage.expectLoaded();
      await editProfilePage.updateFirstName(originalFirstName);
      await editProfilePage.expectSaved();
    });

    test(
      'submits a new first name and shows a success toast',
      { tag: Tag.smoke },
      async ({ myProfilePage, editProfilePage }) => {
        originalFirstName = await editProfilePage.firstNameInput.inputValue();
        const newFirstName = `Auto${faker.string.alpha({ length: 5, casing: 'lower' })}`;

        await editProfilePage.updateFirstName(newFirstName);

        await editProfilePage.expectSaved(); // toast first – it is gone after ~4 s
        await myProfilePage.expectLoaded();
        await myProfilePage.expectNameShown(newFirstName);

        // The form now loads the new value too
        await myProfilePage.openEditProfile();
        await expect(editProfilePage.firstNameInput).toHaveValue(newFirstName);
      },
    );
  });
});
