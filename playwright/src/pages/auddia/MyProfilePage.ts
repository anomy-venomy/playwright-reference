import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

/** Auddia /settings/my-profile – read-only profile summary with an "Edit profile" link */
export class AuddiaMyProfilePage extends BasePage {
  protected readonly path = '/settings/my-profile';

  readonly editProfileLink: Locator;

  constructor(page: Page) {
    super(page);
    this.editProfileLink = page.getByRole('link', { name: 'Edit profile' });
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/settings/my-profile');
    await this.expectVisible(this.editProfileLink);
  }

  @step()
  async openEditProfile(): Promise<void> {
    await this.click(this.editProfileLink);
  }

  /** The summary shows "firstname lastname | account type email" */
  async expectNameShown(firstName: string): Promise<void> {
    await this.expectTextOnPage(firstName);
  }
}
