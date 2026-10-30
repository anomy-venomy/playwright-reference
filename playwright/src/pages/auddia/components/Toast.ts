import { Page, expect } from '@playwright/test';
import { BaseComponent } from '@core/ui/BaseComponent';

/** Auddia toast – role="alert", e.g. "Success! Login successful!"; disappears after ~4 s */
export class AuddiaToast extends BaseComponent {
  constructor(page: Page) {
    super(page, page.getByRole('alert'));
  }

  /** Assert right after the action that triggers it – the toast does not wait for slow checks */
  async expectMessage(message: string): Promise<void> {
    await expect(this.root.filter({ hasText: message })).toBeVisible();
  }
}
