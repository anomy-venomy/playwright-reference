import path from 'path';
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';
import { AuddiaToast } from './components/Toast';
import { ArtistImage } from './AddArtistPage';

/** Test files: a 5 s 16-bit / 44.1 kHz WAV (what the site asks for) and a text file posing as audio */
export const TrackFile = {
  valid: path.resolve(process.cwd(), 'src/data/files/track-5s.wav'),
  notAudio: path.resolve(process.cwd(), 'src/data/files/not-audio.txt'),
};

export type TrackData = {
  title: string;
  album: string;
  stationFormat: string;
  genre: string;
};

/**
 * Auddia /add-track/<artistId> – a 4-step wizard on ONE url; each step is recognised by its heading:
 *   1. title + audio file   2. track image + album + explicit
 *   3. station format, genres, mood, lyrics   4. review → "Submit track"
 */
export class AuddiaAddTrackPage extends BasePage {
  protected readonly path = '/add-track';

  readonly stepHeading: {
    upload: Locator;
    info: Locator;
    classify: Locator;
    review: Locator;
  };
  readonly discardButton: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly submitTrackButton: Locator;
  /** Each step has one file input (audio on step 1, image on step 2) */
  readonly fileInput: Locator;

  // Step 1
  readonly titleInput: Locator;
  /** "100%" appears once the audio file has finished uploading */
  readonly uploadComplete: Locator;
  // Step 2
  readonly imagePreview: Locator;
  readonly albumInput: Locator;
  // Step 3
  readonly stationFormatInput: Locator;
  readonly genresInput: Locator;
  // Step 4
  readonly reviewTitle: Locator;

  readonly toast: AuddiaToast;

  constructor(page: Page) {
    super(page);
    this.stepHeading = {
      upload: page.getByRole('heading', { name: 'Start with uploading the track' }),
      info: page.getByRole('heading', { name: 'Add additional track info' }),
      classify: page.getByRole('heading', { name: 'Now classify the sound and add lyrics' }),
      review: page.getByRole('heading', { name: 'See if everything looks right' }),
    };
    this.discardButton = page.getByRole('button', { name: 'Discard' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.submitTrackButton = page.getByRole('button', { name: 'Submit track' });
    this.fileInput = page.locator('input[type="file"]');

    this.titleInput = page.getByRole('textbox', { name: 'Track title' });
    this.uploadComplete = page.getByText('100%');
    this.imagePreview = page.getByRole('img', { name: 'Track', exact: true });
    this.albumInput = page.getByRole('textbox', { name: 'Album title' });
    this.stationFormatInput = page.getByRole('combobox', { name: 'Station format' });
    this.genresInput = page.getByRole('combobox', { name: 'Genre(s)' });
    this.reviewTitle = page.getByRole('heading', { level: 4 });

    this.toast = new AuddiaToast(page);
  }

  /** The page needs the artist id in the url, e.g. /add-track/293709 */
  @step()
  async openForArtist(artistId: string): Promise<void> {
    await this.open(`${this.path}/${artistId}`);
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/add-track/');
    await this.expectVisible(this.stepHeading.upload);
  }

  // ---------- step 1 ----------
  @step()
  async uploadAudio(filePath: string): Promise<void> {
    await this.uploadFile(this.fileInput, filePath);
  }

  @step()
  async fillUpload(title: string): Promise<void> {
    await this.fill(this.titleInput, title);
    await this.uploadAudio(TrackFile.valid);
    await this.expectVisible(this.uploadComplete);
  }

  // ---------- step 2 ----------
  @step()
  async fillInfo(album: string): Promise<void> {
    await this.uploadFile(this.fileInput, ArtistImage.valid);
    await this.expectVisible(this.imagePreview); // upload accepted
    await this.fill(this.albumInput, album);
  }

  // ---------- step 3 ----------
  /** Both lists are dropdowns – open, pick the option (Playwright scrolls to it), close */
  @step()
  async selectOption(dropdown: Locator, option: string): Promise<void> {
    await this.click(dropdown);
    await this.click(this.page.getByRole('option', { name: option, exact: true }));
    await this.page.keyboard.press('Escape'); // close the list so it does not cover Next
  }

  @step()
  async fillClassification(stationFormat: string, genre: string): Promise<void> {
    await this.selectOption(this.stationFormatInput, stationFormat);
    await this.selectOption(this.genresInput, genre);
  }

  /** Steps 1–3 with valid data, ending on the review step */
  @step()
  async goToReview(track: TrackData): Promise<void> {
    await this.fillUpload(track.title);
    await this.next();
    await this.expectVisible(this.stepHeading.info);
    await this.fillInfo(track.album);
    await this.next();
    await this.expectVisible(this.stepHeading.classify);
    await this.fillClassification(track.stationFormat, track.genre);
    await this.next();
    await this.expectVisible(this.stepHeading.review);
  }

  @step()
  async next(): Promise<void> {
    await this.click(this.nextButton);
  }

  @step()
  async previous(): Promise<void> {
    await this.click(this.previousButton);
  }

  /** Clicking into the title and leaving it shows "Track Title is required." */
  @step()
  async touchTitle(): Promise<void> {
    await this.click(this.titleInput);
    await this.click(this.stepHeading.upload);
  }

  async expectFieldError(message: string): Promise<void> {
    await this.expectVisible(this.page.getByText(message));
  }
}
