import { DashboardPage, EmployeeDetailsPage, LoginPage } from '@pages/index';
import { dataTest } from './data.fixture';

type UiFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeDetailsPage: EmployeeDetailsPage;
};

/**
 * Layer 4 – page objects.
 * Fixtures are lazy: the browser starts only when a test asks for a page object,
 * so API tests never launch one.
 */
export const uiTest = dataTest.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  employeeDetailsPage: async ({ page }, use) => use(new EmployeeDetailsPage(page)),
});
