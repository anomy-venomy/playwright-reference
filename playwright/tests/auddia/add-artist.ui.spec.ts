import { faker } from '@faker-js/faker';
import { test, expect } from '@fixtures/auddia.fixture';
import { ArtistBasics, ArtistImage } from '@pages/auddia/AddArtistPage';
import { Tag } from '@config/tags';

/**
 * Validation-only: these tests walk the wizard but NEVER click "Create artist".
 * The UI has no way to delete an artist, so a real create would leave junk on the shared staging account.
 */
test.describe('Auddia add artist (UI only)', { tag: [Tag.artists, Tag.regression] }, () => {
  const basics = (): ArtistBasics => ({
    name: `PW Artist ${faker.string.alpha(5)}`,
    organization: 'Playwright QA',
    bio: faker.lorem.sentence(),
  });

  // Start from the Artists list, the way a user does (saved session – already logged in)
  test.beforeEach(async ({ artistsPage, addArtistPage }) => {
    await artistsPage.open();
    await artistsPage.expectLoaded();
    await artistsPage.openAddArtist();
    await addArtistPage.expectLoaded();
  });

  test.describe('step 1 – basics', () => {
    test('keeps Next disabled while the form is empty', async ({ addArtistPage }) => {
      await expect(addArtistPage.nameInput).toBeEmpty();
      await expect(addArtistPage.nextButton).toBeDisabled();
    });

    test('shows required messages for empty fields', { tag: Tag.negative }, async ({ addArtistPage }) => {
      await addArtistPage.touchRequiredFields();

      await addArtistPage.expectFieldError('Artist name is required.');
      await addArtistPage.expectFieldError('Organization name is required.');
      await addArtistPage.expectFieldError('Artist bio is required.');
      await expect(addArtistPage.nextButton).toBeDisabled();
    });

    test('rejects an image smaller than 1080 × 1080', { tag: Tag.negative }, async ({ addArtistPage }) => {
      await addArtistPage.uploadImage(ArtistImage.tooSmall);

      await addArtistPage.toast.expectMessage('Image is too small');
      await expect(addArtistPage.imagePreview).toBeHidden();
    });

    test('keeps Next disabled without an image', { tag: Tag.negative }, async ({ addArtistPage }) => {
      const { name, organization, bio } = basics();
      await addArtistPage.fill(addArtistPage.nameInput, name);
      await addArtistPage.fill(addArtistPage.organizationInput, organization);
      await addArtistPage.fill(addArtistPage.bioInput, bio);

      await expect(addArtistPage.nextButton).toBeDisabled();
    });

    test(
      'keeps Next disabled when the bio is over 600 characters',
      { tag: Tag.negative },
      async ({ page, addArtistPage }) => {
        await addArtistPage.fillBasics({ ...basics(), bio: 'a'.repeat(601) });

        await expect(page.getByText('601/600')).toBeVisible();
        await expect(addArtistPage.nextButton).toBeDisabled();
      },
    );

    test('enables Next once every required field is valid', { tag: Tag.smoke }, async ({ addArtistPage }) => {
      await addArtistPage.fillBasics(basics());
      await addArtistPage.selectState('California');

      await expect(addArtistPage.nextButton).toBeEnabled();
    });
  });

  test.describe('steps 2–4', () => {
    test.beforeEach(async ({ addArtistPage }) => {
      await addArtistPage.fillBasics(basics());
      await addArtistPage.next();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.style);
    });

    test('step 2 requires at least one genre', { tag: Tag.negative }, async ({ addArtistPage }) => {
      await expect(addArtistPage.nextButton).toBeDisabled();

      await addArtistPage.selectGenre('Acid Jazz');
      await addArtistPage.addSimilarArtist('Adele');

      await expect(addArtistPage.nextButton).toBeEnabled();
    });

    test('step 3 rejects an invalid link', { tag: Tag.negative }, async ({ addArtistPage }) => {
      await addArtistPage.selectGenre('Acid Jazz');
      await addArtistPage.next();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.online);

      await addArtistPage.fill(addArtistPage.spotifyInput, 'not a url');
      await addArtistPage.click(addArtistPage.appleMusicInput); // leave the field to trigger validation

      await addArtistPage.expectFieldError('Invalid URL.');
      await expect(addArtistPage.nextButton).toBeDisabled();
    });

    test(
      'walks every step up to "Create artist" without submitting',
      { tag: Tag.smoke },
      async ({ addArtistPage }) => {
        await addArtistPage.selectGenre('Acid Jazz');
        await addArtistPage.next();
        await addArtistPage.expectVisible(addArtistPage.stepHeading.online);

        await addArtistPage.fill(addArtistPage.spotifyInput, 'https://open.spotify.com/artist/playwright');
        await addArtistPage.next();
        await addArtistPage.expectVisible(addArtistPage.stepHeading.socials);
        await expect(addArtistPage.createArtistButton).toBeEnabled();
      },
    );

    test('Previous goes back and keeps the entered values', async ({ page, addArtistPage }) => {
      await addArtistPage.selectGenre('Acid Jazz');
      await addArtistPage.next();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.online);

      await addArtistPage.previous();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.style);
      await expect(page.getByText('Acid Jazz')).toBeVisible();

      await addArtistPage.previous();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.basics);
      await expect(addArtistPage.organizationInput).toHaveValue('Playwright QA');
    });
  });

  test('Discard asks for confirmation and returns to the artist list', async ({
    page,
    artistsPage,
    addArtistPage,
  }) => {
    await addArtistPage.fill(addArtistPage.nameInput, 'Not saved');

    await addArtistPage.discard();

    await artistsPage.expectLoaded();
    await expect(page.getByText('Not saved')).toBeHidden();
  });
});
