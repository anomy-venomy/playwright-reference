import { test as setup } from '@playwright/test';
import { ApiClient } from '@core/api/ApiClient';
import { AuddiaService } from '@api/auddia/AuddiaService';
import { saveSession } from '@api/auddia/session';
import { config } from '@config/env.config';
import { logger } from '@core/utils/logger';

/**
 * Runs once before the auddia tests.
 * Logs in through the API (no login form), loads the profile and saves the session
 * to .auth/auddia.json – every browser test then starts already logged in.
 */
setup('auddia: log in via API and save session', async ({ request }) => {
  const { apiBaseUrl, email, password, authFile } = config.auddia;
  const auddia = new AuddiaService(new ApiClient(request, apiBaseUrl, 'Bearer'));

  const login = await auddia.loginOrFail(email, password);
  const profileResponse = await auddia.getProfile(login.userId);
  if (!profileResponse.body.status) throw new Error(`Profile fetch failed:\n${profileResponse}`);
  const profile = profileResponse.body.data;

  await saveSession(request, login, profile);
  logger.info(`Auddia session saved to ${authFile}`);
});
