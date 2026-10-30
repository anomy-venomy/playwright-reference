import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';
import { AuddiaToast } from './components/Toast';

/** Auddia /login – email + password form; "Sign in" stays disabled until both fields are valid */
export class AuddiaLoginPage extends BasePage {
  protected readonly path = '/login';

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  /** Eye icon inside the password field – its name flips between "Show Password" and "Hide Password" */
  readonly showPasswordButton: Locator;
  readonly hidePasswordButton: Locator;
  readonly rememberMe: Locator;
  readonly signInButton: Locator;
  readonly toast: AuddiaToast;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in' });
    this.emailInput = page.getByLabel('Email address');
    // exact: true – otherwise the "Show Password" button matches too (strict mode violation)
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.showPasswordButton = page.getByRole('button', { name: 'Show Password' });
    this.hidePasswordButton = page.getByRole('button', { name: 'Hide Password' });
    this.rememberMe = page.getByRole('checkbox', { name: 'Remember me' });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.toast = new AuddiaToast(page);
  }

  async expectLoaded(): Promise<void> {
    await this.expectUrlContains('/login');
    await this.expectVisible(this.heading);
  }

  @step()
  async login(email: string, password: string): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.signInButton);
  }

  /** Clicking into a field and leaving it is what triggers its validation message */
  @step()
  async touchFields(): Promise<void> {
    await this.click(this.emailInput);
    await this.click(this.passwordInput);
    await this.click(this.emailInput);
  }

  /** Field messages are plain text under the input, e.g. "Email address is required." */
  async expectFieldError(message: string): Promise<void> {
    await this.expectVisible(this.page.getByText(message));
  }
}
