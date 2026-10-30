import { faker } from '@faker-js/faker';
import { test, expect } from '@fixtures/auddia.fixture';
import { ArtistBasics } from '@pages/auddia/AddArtistPage';
import { TrackData, TrackFile } from '@pages/auddia/AddTrackPage';
import { Tag } from '@config/tags';

/**
 * Creates ONE real artist through the UI, then tests the add-track wizard for that artist.
 * - The UI cannot delete artists, so every run leaves one "PW Artist …" behind on staging.
 * - Tracks are never submitted: the tests stop on the review step, before "Submit track"
 *   (submitting may lead to a paid plan).
 */
test.describe('Auddia add track (UI only)', { tag: [Tag.tracks, Tag.regression] }, () => {
  // Serial: every test needs the artist created by the first one; if that fails the rest are skipped
  test.describe.configure({ mode: 'serial' });

  const artist: ArtistBasics = {
    name: `PW Artist ${faker.string.alpha(6)}`,
    organization: 'Playwright QA',
    bio: faker.lorem.sentence(),
  };
  let artistId = '';

  const track = (): TrackData => ({
    title: `PW Track ${faker.string.alpha(5)}`,
    album: `PW Album ${faker.string.alpha(5)}`,
    stationFormat: 'Adult Contemporary',
    genre: 'Acid Jazz',
  });

  test(
    'creates an artist and redirects to its detail page',
    { tag: Tag.smoke },
    async ({ page, artistsPage, addArtistPage }) => {
      await artistsPage.open();
      await artistsPage.openAddArtist();
      await addArtistPage.expectLoaded();

      await addArtistPage.fillBasics(artist);
      await addArtistPage.next();
      await addArtistPage.selectGenre('Acid Jazz');
      await addArtistPage.next();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.online);
      await addArtistPage.next();
      await addArtistPage.expectVisible(addArtistPage.stepHeading.socials);

      artistId = await addArtistPage.createArtist();

      await addArtistPage.toast.expectMessage('Success');
      expect(artistId).toMatch(/^\d+$/);
      await expect(page.getByText(artist.name).first()).toBeVisible();
    },
  );

  test.describe('add track for the new artist', () => {
    // Open the add-track page directly with the id from the redirect url
    test.beforeEach(async ({ addTrackPage }) => {
      expect(artistId, 'artist was not created').not.toBe('');
      await addTrackPage.openForArtist(artistId);
      await addTrackPage.expectLoaded();
    });

    test('step 1 requires a title and an audio file', { tag: Tag.negative }, async ({ addTrackPage }) => {
      await expect(addTrackPage.nextButton).toBeDisabled();

      await addTrackPage.touchTitle();
      await addTrackPage.expectFieldError('Track Title is required.');

      // A title alone is not enough – the file is required too
      await addTrackPage.fill(addTrackPage.titleInput, 'Only a title');
      await expect(addTrackPage.nextButton).toBeDisabled();
    });

    test('rejects a file that is not audio', { tag: Tag.negative }, async ({ addTrackPage }) => {
      await addTrackPage.uploadAudio(TrackFile.notAudio);

      await addTrackPage.toast.expectMessage('Please upload a valid audio file');
      await expect(addTrackPage.nextButton).toBeDisabled();
    });

    test(
      'step 2 requires a track image and an album title',
      { tag: Tag.negative },
      async ({ addTrackPage }) => {
        await addTrackPage.fillUpload(track().title);
        await addTrackPage.next();
        await addTrackPage.expectVisible(addTrackPage.stepHeading.info);
        await expect(addTrackPage.nextButton).toBeDisabled();

        await addTrackPage.fill(addTrackPage.albumInput, 'Album without image');
        await expect(addTrackPage.nextButton).toBeDisabled();

        await addTrackPage.fillInfo('Album with image');
        await expect(addTrackPage.nextButton).toBeEnabled();
      },
    );

    test('step 3 requires a station format and a genre', { tag: Tag.negative }, async ({ addTrackPage }) => {
      const data = track();
      await addTrackPage.fillUpload(data.title);
      await addTrackPage.next();
      await addTrackPage.fillInfo(data.album);
      await addTrackPage.next();
      await addTrackPage.expectVisible(addTrackPage.stepHeading.classify);
      await expect(addTrackPage.nextButton).toBeDisabled();

      await addTrackPage.selectOption(addTrackPage.stationFormatInput, data.stationFormat);
      await expect(addTrackPage.nextButton).toBeDisabled();

      await addTrackPage.selectOption(addTrackPage.genresInput, data.genre);
      await expect(addTrackPage.nextButton).toBeEnabled();
    });

    test(
      'review step shows everything entered, without submitting',
      { tag: Tag.smoke },
      async ({ page, addTrackPage }) => {
        const data = track();

        await addTrackPage.goToReview(data);

        await expect(addTrackPage.reviewTitle).toHaveText(data.title);
        await expect(page.getByText(artist.name).first()).toBeVisible(); // the track belongs to the new artist
        await expect(page.getByText(data.album).first()).toBeVisible();
        await expect(page.getByText('track-5s.wav')).toBeVisible();
        await expect(page.getByText(data.stationFormat)).toBeVisible();
        await expect(page.getByText(data.genre)).toBeVisible();
        await expect(addTrackPage.submitTrackButton).toBeEnabled(); // NOT clicked – see the note at the top
      },
    );

    test('Previous goes back and keeps the entered values', async ({ addTrackPage }) => {
      const data = track();
      await addTrackPage.fillUpload(data.title);
      await addTrackPage.next();
      await addTrackPage.fillInfo(data.album);

      await addTrackPage.previous();
      await addTrackPage.expectVisible(addTrackPage.stepHeading.upload);
      await expect(addTrackPage.titleInput).toHaveValue(data.title);

      await addTrackPage.next();
      await expect(addTrackPage.albumInput).toHaveValue(data.album);
    });
  });
});
