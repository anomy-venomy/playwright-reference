import { test, expect } from '@fixtures/auddia.fixture';
import { config } from '@config/env.config';
import { Tag } from '@config/tags';

test.describe('Auddia auth API', { tag: Tag.auth }, () => {
  test('logs in with valid credentials', { tag: Tag.smoke }, async ({ auddiaGuest }) => {
    const response = await auddiaGuest.login(config.auddia.email, config.auddia.password);

    await expect(response).toHaveStatus(200);
    await expect(response).toHaveField('status', true);
    await expect(response).toHaveField('data.token');
    await expect(response).toHaveField('data.userId');
  });

  test('rejects a wrong password', { tag: Tag.negative }, async ({ auddiaGuest }) => {
    const response = await auddiaGuest.login(config.auddia.email, 'wrong-password');

    await expect(response).toHaveStatus(400);
    await expect(response).toHaveField('status', false);
    await expect(response).toHaveField('message', 'The user credentials are invalid.');
  });

  test('saved session can read the profile', async ({ auddiaApi, auddiaUser }) => {
    const response = await auddiaApi.getProfile(auddiaUser.userId);

    await expect(response).toHaveStatus(200);
    await expect(response).toHaveField('data.email', config.auddia.email);
  });

  test('after logout the profile is refused', async ({ auddiaGuest }) => {
    // Own fresh login – never log out the shared saved session
    const user = await auddiaGuest.loginOrFail(config.auddia.email, config.auddia.password);
    await expect(await auddiaGuest.getProfile(user.userId)).toHaveStatus(200);

    auddiaGuest.logout();

    const response = await auddiaGuest.getProfile(user.userId);
    await expect(response).toHaveStatus(401);
  });
});
