import { Locator, Page } from '@playwright/test';

/**
 * A reusable piece of UI that appears on many pages (header, modal, table, toast…).
 * Every locator is scoped to `root`, so components never clash with the rest of the page.
 */
export abstract class BaseComponent {
  protected readonly root: Locator;

  constructor(
    protected readonly page: Page,
    root: Locator,
  ) {
    this.root = root;
  }

  async isDisplayed(): Promise<boolean> {
    return this.root.isVisible();
  }
}
