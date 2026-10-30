import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

/** /login – email + password form, "Remember me", forgot-password and sign-up links */
export class LoginPage extends BasePage {
  protected readonly path = '/login';

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMe: Locator;
  readonly submitButton: Locator;
  /** Form-level error banner, e.g. "Invalid email or password" */
  readonly formError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Log in to your account' });
    this.emailInput = page.getByLabel('Email');
    // Label text is "Password *" (required marker), so no exact match
    this.passwordInput = page.getByLabel('Password');
    this.rememberMe = page.getByRole('checkbox', { name: 'Remember me' });
    this.submitButton = page.getByRole('button', { name: 'Log in' });
    this.formError = page.locator('.alert-error');
  }

  @step()
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.check(this.rememberMe, rememberMe);
    await this.click(this.submitButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle('Login | WorkFlow Manager');
    await this.expectVisible(this.heading);
  }

  async expectError(message: string): Promise<void> {
    await this.expectText(this.formError, message);
  }

  /** Field errors are linked to the input through aria-describedby */
  async expectFieldError(field: Locator, message: string): Promise<void> {
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(field).toHaveAccessibleDescription(message);
  }
}
