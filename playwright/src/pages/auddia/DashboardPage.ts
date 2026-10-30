import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

/** Auddia /dashboard – landing page after login; the top navigation holds "Settings" and "Sign out" */
export class AuddiaDashboardPage extends BasePage {
  protected readonly path = '/dashboard';

  readonly heading: Locator;
  readonly settingsLink: Locator;
  readonly signOutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });
    this.signOutLink = page.getByRole('link', { name: 'Sign out' });
  }

  /** Waits past the "Loading..." text until the real dashboard is shown */
  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/dashboard');
    await this.expectVisible(this.heading);
  }

  @step()
  async openSettings(): Promise<void> {
    await this.click(this.settingsLink);
  }

  @step()
  async signOut(): Promise<void> {
    await this.click(this.signOutLink);
  }
}
