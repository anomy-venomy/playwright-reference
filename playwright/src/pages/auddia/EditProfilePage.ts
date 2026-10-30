import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';
import { AuddiaToast } from './components/Toast';

/** Auddia /settings/edit-profile – first name, last name, email; saving returns to My profile */
export class AuddiaEditProfilePage extends BasePage {
  protected readonly path = '/settings/edit-profile';

  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  /** Disabled until a field changes, and while any field is invalid */
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly backLink: Locator;
  readonly toast: AuddiaToast;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Edit profile' });
    this.firstNameInput = page.getByLabel('First name');
    this.lastNameInput = page.getByLabel('Last name');
    this.emailInput = page.getByLabel('Email address');
    this.updateButton = page.getByRole('button', { name: 'Update profile' });
    // The button text is "Cancel ✕", so match on the start only
    this.cancelButton = page.getByRole('button', { name: /^Cancel/ });
    this.backLink = page.getByRole('link', { name: 'Back to my profile' });
    this.toast = new AuddiaToast(page);
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/settings/edit-profile');
    await this.expectVisible(this.heading);
    await expect(this.firstNameInput).not.toBeEmpty(); // saved profile has been loaded into the form
  }

  @step()
  async updateFirstName(firstName: string): Promise<void> {
    await this.fill(this.firstNameInput, firstName);
    await this.click(this.updateButton);
  }

  /** Empties every field, then clicks the heading so the last field loses focus and validates */
  @step()
  async clearAllFields(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.click(this.heading);
  }

  /** Field messages are plain text under the input, e.g. "First name is required." */
  async expectFieldError(message: string): Promise<void> {
    await this.expectVisible(this.page.getByText(message));
  }

  @step()
  async cancel(): Promise<void> {
    await this.click(this.cancelButton);
  }

  async expectSaved(): Promise<void> {
    await this.toast.expectMessage('Profile updated successfully');
    await this.expectUrlContains('/settings/my-profile');
  }
}
