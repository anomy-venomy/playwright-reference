import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ApiClient } from '@core/api/ApiClient';
import { AuthService } from '@api/services/AuthService';
import { config } from '@config/env.config';
import { logger } from '@core/utils/logger';

/**
 * Runs once before the ui/e2e projects.
 * Logs in through the API (no browser, no login form) and saves the session cookie
 * to .auth/user.json. Every browser test then starts already logged in.
 */
setup('authenticate via API and save storage state', async ({ request }) => {
  await new AuthService(new ApiClient(request)).loginOrFail(config.user.email, config.user.password);

  // The httpOnly wf_token cookie now lives in this request context – write it to disk
  fs.mkdirSync(path.dirname(config.authFile), { recursive: true });
  await request.storageState({ path: config.authFile });
  logger.info(`Storage state saved to ${config.authFile}`);
});
