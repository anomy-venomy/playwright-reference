import { test, expect } from '@fixtures/index';
import { Tag } from '@config/tags';
import { Timeouts } from '@config/timeouts';

/**
 * Hybrid tests: the API does fast setup and backend verification,
 * the browser covers only the user behaviour under test.
 * The browser is already logged in via the saved session from tests/setup/auth.setup.ts.
 */
test.describe('Employee lifecycle across API and Web', { tag: Tag.employees }, () => {
  test(
    'employee created via API is visible in the web app',
    { tag: [Tag.smoke, Tag.regression] },
    async ({ existingEmployee, employeeDetailsPage }) => {
      const { employee } = existingEmployee;

      await employeeDetailsPage.openById(employee.id);
      await employeeDetailsPage.expectEmployee(employee.fullName, employee.employeeCode);
    },
  );

  test(
    'employee deleted in the web app is removed from the backend',
    { tag: Tag.regression },
    async ({ existingEmployee, employeeDetailsPage, api, page }) => {
      const { id } = existingEmployee.employee;

      await employeeDetailsPage.openById(id);
      await employeeDetailsPage.deleteEmployee();

      await expect(
        page.getByRole('status').filter({ hasText: 'Employee deleted successfully' }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/employees$/);

      await test.step('verify via API', async () => {
        await expect
          .poll(async () => (await api.employees.getById(id)).status, { timeout: Timeouts.poll })
          .toBe(404);
      });
    },
  );
});
