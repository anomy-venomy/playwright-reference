import { Employee, EmployeeInput } from '@api/models/employee.model';
import { DataFactory } from '@data/dataFactory';
import { apiTest } from './api.fixture';

type CreatedEmployee = { input: EmployeeInput; employee: Employee };

type DataFixtures = {
  /** Factory: creates an employee via API and schedules its deletion */
  createEmployee: (overrides?: Partial<EmployeeInput>) => Promise<CreatedEmployee>;
  /** Ready-made employee for tests that just need one to exist */
  existingEmployee: CreatedEmployee;
};

/** Layer 3 – test data with automatic teardown */
export const dataTest = apiTest.extend<DataFixtures>({
  createEmployee: async ({ seedApi, cleanup }, use) => {
    await use(async (overrides = {}) => {
      const input = DataFactory.employee(overrides);
      const employee = await seedApi.employees.createOrFail(input);
      // A 404 here (test already deleted it) is fine – ApiClient never throws on status codes
      cleanup.add(`delete employee ${employee.employeeCode}`, () => seedApi.employees.delete(employee.id));
      return { input, employee };
    });
  },

  existingEmployee: async ({ createEmployee }, use) => {
    await use(await createEmployee());
  },
});
