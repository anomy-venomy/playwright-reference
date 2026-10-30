import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';

/** /dashboard – landing page after login */
export class DashboardPage extends BasePage {
  protected readonly path = '/dashboard';

  readonly heading: Locator;
  readonly welcomeName: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
    this.welcomeName = page.getByTestId('welcome-name');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  async expectLoggedInAs(firstName: string): Promise<void> {
    await this.expectUrlContains(this.path);
    await this.expectVisible(this.heading);
    await this.expectText(this.welcomeName, firstName);
  }
}
