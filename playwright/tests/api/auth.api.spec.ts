import { test, expect } from '@fixtures/index';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';
import users from '@data/users.json';

test.describe('Authentication API', { tag: Tag.auth }, () => {
  test('logs in with valid credentials', { tag: [Tag.smoke, Tag.regression] }, async ({ guestApi }) => {
    const response = await guestApi.auth.login(config.user.email, config.user.password);

    await expect(response).toHaveStatus(200);
    await expect(response).toMatchSchema('user');
    await expect(response).toHaveField('data.email', config.user.email);
    await expect(response).toRespondWithin(5_000);
    expect(response.headers['set-cookie']).toMatch(/wf_token=.+; Path=\/; HttpOnly/);
  });

  test('returns the current user for a logged-in session', { tag: Tag.regression }, async ({ api }) => {
    const response = await api.auth.me();

    await expect(response).toHaveStatus(200);
    await expect(response).toMatchSchema('user');
    await expect(response).toHaveField('data.role', 'ADMIN');
  });

  // Data-driven: one test per row in src/data/users.json
  for (const { case: name, email, password, status } of users.invalidLogins) {
    test(`rejects login: ${name}`, { tag: [Tag.regression, Tag.negative] }, async ({ guestApi }) => {
      const response = await guestApi.auth.login(email, password);

      await expect(response).toHaveStatus(status);
      await expect(response).toHaveField('error.message');
    });
  }

  test(
    'rejects /auth/me without a session',
    { tag: [Tag.regression, Tag.negative] },
    async ({ guestApi }) => {
      await expect(await guestApi.auth.me()).toHaveStatus(401);
    },
  );
});
