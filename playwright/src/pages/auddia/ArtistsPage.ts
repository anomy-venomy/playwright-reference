import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

/** Auddia /artist – list of the account's artists with an "Add an artist" button */
export class AuddiaArtistsPage extends BasePage {
  protected readonly path = '/artist';

  readonly heading: Locator;
  readonly addArtistButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Artists' });
    this.addArtistButton = page.getByRole('button', { name: 'Add an artist' });
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/artist');
    await this.expectVisible(this.heading);
    await this.expectVisible(this.addArtistButton);
  }

  @step()
  async openAddArtist(): Promise<void> {
    await this.click(this.addArtistButton);
  }
}
