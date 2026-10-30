import { Locator, Page, Response, expect, test } from '@playwright/test';
import { logger } from '../utils/logger';

/**
 * Reusable UI actions shared by every page object.
 * Pages describe WHAT is on the screen; BasePage knows HOW to interact safely.
 * All methods rely on Playwright auto-waiting – no hard sleeps anywhere.
 */
export abstract class BasePage {
  /** Relative path of the page, e.g. '/login'. Override in subclasses. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  // ---------- navigation ----------
  async open(pathOverride?: string): Promise<void> {
    const target = pathOverride ?? this.path;
    logger.debug(`Navigating to ${target}`);
    await this.page.goto(target);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(escapeRegex(fragment)));
  }

  // ---------- actions ----------
  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  async typeSlowly(locator: Locator, value: string, delayMs = 50): Promise<void> {
    await locator.pressSequentially(value, { delay: delayMs });
  }

  async selectByLabel(locator: Locator, label: string): Promise<void> {
    await locator.selectOption({ label });
  }

  async check(locator: Locator, checked = true): Promise<void> {
    await locator.setChecked(checked);
  }

  async press(locator: Locator, key: string): Promise<void> {
    await locator.press(key);
  }

  async uploadFile(locator: Locator, filePath: string | string[]): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  async getText(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
  }

  async getAllTexts(locator: Locator): Promise<string[]> {
    return (await locator.allInnerTexts()).map((t) => t.trim());
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  // ---------- network helpers ----------
  /** Run an action and return the matching backend response (e.g. capture an id the UI created) */
  async actionAndWaitForResponse(
    action: () => Promise<void>,
    urlPart: string,
    method = 'GET',
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes(urlPart) && r.request().method() === method.toUpperCase(),
      ),
      action(),
    ]);
    return response;
  }

  /** Accept the next browser dialog (confirm/alert) */
  acceptNextDialog(): void {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  // ---------- assertions ----------
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async expectHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  async expectText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  async expectContainsText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toContainText(text);
  }

  async expectTextOnPage(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
  }

  // ---------- evidence ----------
  async attachScreenshot(name: string): Promise<void> {
    await test
      .info()
      .attach(name, { body: await this.page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
