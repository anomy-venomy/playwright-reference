import path from 'path';
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';
import { AuddiaToast } from './components/Toast';

/** Test images: the site rejects anything smaller than 1080 × 1080 */
export const ArtistImage = {
  valid: path.resolve(process.cwd(), 'src/data/files/artist-1080.png'),
  tooSmall: path.resolve(process.cwd(), 'src/data/files/artist-too-small.png'),
};

export type ArtistBasics = { name: string; organization: string; bio: string; image?: string };

/**
 * Auddia /add-artist – a 4-step wizard on ONE url; each step is recognised by its heading:
 *   1. basics (name, image, organization, location, bio)  2. genres + similar artists
 *   3. online links                                        4. socials → "Create artist"
 */
export class AuddiaAddArtistPage extends BasePage {
  protected readonly path = '/add-artist';

  readonly stepHeading: {
    basics: Locator;
    style: Locator;
    online: Locator;
    socials: Locator;
  };
  readonly discardButton: Locator;
  readonly backToArtistsButton: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly createArtistButton: Locator;

  // Step 1
  readonly nameInput: Locator;
  readonly imageInput: Locator;
  readonly imagePreview: Locator;
  readonly organizationInput: Locator;
  readonly stateInput: Locator;
  readonly bioInput: Locator;
  // Step 2
  readonly genresInput: Locator;
  readonly similarArtistsInput: Locator;
  // Step 3 – one example link field is enough for validation tests
  readonly spotifyInput: Locator;
  readonly appleMusicInput: Locator;

  /** "Are you sure you want to discard the changes?" modal */
  readonly discardDialog: Locator;
  readonly confirmDiscardButton: Locator;
  readonly toast: AuddiaToast;

  constructor(page: Page) {
    super(page);
    this.stepHeading = {
      basics: page.getByRole('heading', { name: 'Tell us about the artist' }),
      style: page.getByRole('heading', { name: 'Categorize the artist’s musical style' }),
      online: page.getByRole('heading', { name: 'Where can the artist be found online?' }),
      socials: page.getByRole('heading', { name: 'Where can listeners follow on socials?' }),
    };
    this.discardButton = page.getByRole('button', { name: 'Discard' });
    this.backToArtistsButton = page.getByRole('button', { name: 'Back to artists' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.createArtistButton = page.getByRole('button', { name: 'Create artist' });

    this.nameInput = page.getByLabel('Artist name');
    this.imageInput = page.locator('input[type="file"]');
    this.imagePreview = page.getByRole('img', { name: 'Artist', exact: true });
    this.organizationInput = page.getByLabel('Organization name');
    // role – getByLabel also matches the dropdown button next to it (strict mode violation)
    this.stateInput = page.getByRole('combobox', { name: 'State/Province' });
    this.bioInput = page.getByLabel('Artist bio');

    this.genresInput = page.getByRole('combobox', { name: 'Genre(s)' });
    this.similarArtistsInput = page.getByRole('textbox', { name: 'Similar artist(s)' });

    this.spotifyInput = page.getByRole('textbox', { name: 'Spotify URL' });
    this.appleMusicInput = page.getByRole('textbox', { name: 'Apple Music URL' });

    this.discardDialog = page.getByRole('dialog');
    this.confirmDiscardButton = this.discardDialog.getByRole('button', { name: 'Yes, discard changes' });
    this.toast = new AuddiaToast(page);
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/add-artist');
    await this.expectVisible(this.stepHeading.basics);
  }

  @step()
  async uploadImage(filePath: string): Promise<void> {
    await this.uploadFile(this.imageInput, filePath);
  }

  /** Fills every required field of step 1 */
  @step()
  async fillBasics({ name, organization, bio, image = ArtistImage.valid }: ArtistBasics): Promise<void> {
    await this.fill(this.nameInput, name);
    await this.uploadImage(image);
    await this.expectVisible(this.imagePreview); // upload accepted
    await this.fill(this.organizationInput, organization);
    await this.fill(this.bioInput, bio);
  }

  /** State is a type-ahead: type part of the name, then pick the option */
  @step()
  async selectState(state: string): Promise<void> {
    await this.typeSlowly(this.stateInput, state.slice(0, 5));
    await this.click(this.page.getByRole('option', { name: state, exact: true }));
  }

  /** Genres is a multi-select with ~1400 options – open it, pick one (Playwright scrolls to it) */
  @step()
  async selectGenre(genre: string): Promise<void> {
    await this.click(this.genresInput);
    await this.click(this.page.getByRole('option', { name: genre, exact: true }));
    await this.page.keyboard.press('Escape'); // close the list so it does not cover Next
  }

  @step()
  async addSimilarArtist(name: string): Promise<void> {
    await this.fill(this.similarArtistsInput, name);
    await this.press(this.similarArtistsInput, 'Enter');
  }

  @step()
  async next(): Promise<void> {
    await this.click(this.nextButton);
  }

  @step()
  async previous(): Promise<void> {
    await this.click(this.previousButton);
  }

  /** Clicks into each required field and leaves it – that is what shows the "… is required." messages */
  @step()
  async touchRequiredFields(): Promise<void> {
    await this.click(this.nameInput);
    await this.click(this.organizationInput);
    await this.click(this.bioInput);
    await this.click(this.stepHeading.basics);
  }

  /**
   * Clicks "Create artist" (REAL create – the UI cannot delete artists) and waits for the
   * redirect to /artist-detail/<id>. Returns that id, e.g. for /add-track/<id>.
   */
  @step()
  async createArtist(): Promise<string> {
    await this.click(this.createArtistButton);
    await expect(this.page).toHaveURL(/\/artist-detail\/\d+/);
    return this.page.url().match(/\/artist-detail\/(\d+)/)![1];
  }

  @step()
  async discard(): Promise<void> {
    await this.click(this.discardButton);
    await this.expectVisible(this.discardDialog);
    await this.click(this.confirmDiscardButton);
  }

  /** Field messages are plain text under the input, e.g. "Artist name is required." */
  async expectFieldError(message: string): Promise<void> {
    await this.expectVisible(this.page.getByText(message));
  }
}
