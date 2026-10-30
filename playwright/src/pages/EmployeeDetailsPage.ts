import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/ui/BasePage';
import { step } from '@core/utils/step.decorator';

/** /employees/:id – read-only employee profile with Edit / Delete for admins */
export class EmployeeDetailsPage extends BasePage {
  protected readonly path = '/employees';

  readonly heading: Locator;
  readonly summary: Locator;
  readonly deleteButton: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.summary = page.locator('.page-header .muted');
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.confirmDialog = page.getByRole('dialog', { name: 'Delete employee' });
  }

  @step()
  async openById(id: number): Promise<void> {
    await this.open(`${this.path}/${id}`);
  }

  async expectEmployee(fullName: string, employeeCode: string): Promise<void> {
    await this.expectText(this.heading, fullName);
    await this.expectContainsText(this.summary, employeeCode);
  }

  @step()
  async deleteEmployee(): Promise<void> {
    await this.click(this.deleteButton);
    await this.expectVisible(this.confirmDialog);
    await this.click(this.confirmDialog.getByRole('button', { name: 'Delete' }));
  }
}
