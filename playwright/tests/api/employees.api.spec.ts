import { test, expect } from '@fixtures/index';
import { Tag } from '@config/tags';
import { DataFactory } from '@data/dataFactory';
import users from '@data/users.json';

test.describe('Employees API', { tag: Tag.employees }, () => {
  test('creates an employee', { tag: [Tag.smoke, Tag.regression] }, async ({ api, seedApi, cleanup }) => {
    const input = DataFactory.employee();

    const response = await api.employees.create(input);
    if (response.ok) {
      cleanup.add('delete created employee', () => seedApi.employees.delete(response.body.data.id));
    }

    await expect(response).toHaveStatus(201);
    await expect(response).toMatchSchema('employee');
    await expect(response).toRespondWithin(3_000);
    expect(response.body.data).toMatchObject({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      employeeCode: input.employeeCode,
      department: { id: input.departmentId },
      role: { id: input.roleId },
    });
  });

  test('fetches an existing employee by id', { tag: Tag.regression }, async ({ api, existingEmployee }) => {
    const { id, employeeCode } = existingEmployee.employee;

    const response = await api.employees.getById(id);

    await expect(response).toHaveStatus(200);
    await expect(response).toMatchSchema('employee');
    await expect(response).toHaveField('data.employeeCode', employeeCode);
  });

  test('updates an employee', { tag: Tag.regression }, async ({ api, existingEmployee }) => {
    const { input, employee } = existingEmployee;

    const changes = { state: 'Maharashtra', city: 'Pune', salary: 3_000_000 };

    const response = await api.employees.update(employee.id, { ...input, ...changes });

    await expect(response).toHaveStatus(200);
    await expect(response).toHaveField('data.state', 'Maharashtra');
    await expect(response).toHaveField('data.city', 'Pune');
    await expect(response).toHaveField('data.salary', 3_000_000);
  });

  test('deletes an employee', { tag: [Tag.smoke, Tag.regression] }, async ({ api, existingEmployee }) => {
    const { id } = existingEmployee.employee;

    await expect(await api.employees.delete(id)).toHaveStatus(200);
    await expect(await api.employees.getById(id)).toHaveStatus(404);
  });

  test('lists employees respecting the page size', { tag: Tag.regression }, async ({ api }) => {
    const response = await api.employees.list({ page: 1, pageSize: 5 });

    await expect(response).toHaveStatus(200);
    await expect(response).toMatchSchema('employee-list');
    await expect(response).toHaveField('meta.pageSize', 5);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  test.describe('validation & access', { tag: [Tag.regression, Tag.negative] }, () => {
    test('rejects an empty body with field errors', async ({ api }) => {
      const response = await api.employees.create({} as never);

      await expect(response).toHaveStatus(400);
      await expect(response).toHaveField('error.details.email', 'Email is required');
      await expect(response).toHaveField('error.details.employeeCode', 'Employee ID is required');
    });

    test('rejects a role from another department', async ({ api }) => {
      const response = await api.employees.create(DataFactory.employee({ departmentId: 2 })); // role 3 is Engineering

      await expect(response).toHaveStatus(400);
      await expect(response).toHaveField(
        'error.details.roleId',
        'Job role does not belong to the selected department',
      );
    });

    test('rejects a city that is not in the selected state', async ({ api }) => {
      const response = await api.employees.create(DataFactory.employee({ state: 'Rajasthan', city: 'Pune' }));

      await expect(response).toHaveStatus(400);
      await expect(response).toHaveField(
        'error.details.city',
        'Select a valid country, state and city combination',
      );
    });

    test('rejects a duplicate email', async ({ api, existingEmployee }) => {
      const response = await api.employees.create(
        DataFactory.employee({ email: existingEmployee.input.email }),
      );

      await expect(response).toHaveStatus(409);
    });

    test('rejects requests without a session', async ({ guestApi }) => {
      await expect(await guestApi.employees.list()).toHaveStatus(401);
    });

    test('forbids a viewer from creating employees', async ({ guestApi }) => {
      await guestApi.auth.loginOrFail(users.viewer.email, users.viewer.password);

      await expect(await guestApi.employees.create(DataFactory.employee())).toHaveStatus(403);
    });
  });
});
