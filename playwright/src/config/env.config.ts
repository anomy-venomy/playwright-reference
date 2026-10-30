import dotenv from 'dotenv';
import path from 'path';

/**
 * Environment resolution order (first value wins – dotenv never overrides):
 *   1. Real process env (CI secrets / Jenkins credentials)
 *   2. env/.env.local       (developer machine, git-ignored)
 *   3. env/.env.<TEST_ENV>  (non-secret per-environment values, committed)
 */
export const TEST_ENV = process.env.TEST_ENV ?? 'qa';

dotenv.config({ path: path.resolve(process.cwd(), 'env/.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), `env/.env.${TEST_ENV}`) });

// Reads a required env variable; throws a clear error if it's missing
function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing env variable "${name}" for TEST_ENV="${TEST_ENV}"`);
  }
  return value;
}

export const config = {
  env: TEST_ENV,
  isCI: !!process.env.CI,
  uiBaseUrl: read('UI_BASE_URL'), // frontend URL, used as Playwright baseURL
  apiBaseUrl: read('API_BASE_URL'), // backend URL, used by ApiClient
  headless: (process.env.HEADLESS ?? 'true') !== 'false',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  reportDir: process.env.REPORT_DIR ?? 'reports',
  authFile: path.resolve(process.cwd(), '.auth/user.json'), // saved login session
  // Test user for the local WorkFlow Manager app
  user: {
    email: read('TEST_USER_EMAIL'),
    password: read('TEST_USER_PASSWORD'),
    username: read('TEST_USER_NAME'),
  },

  // Auddia stage – external site used for the team demo (optional, empty when not set)
  auddia: {
    uiBaseUrl: process.env.AUDDIA_UI_URL ?? '',
    apiBaseUrl: process.env.AUDDIA_API_URL ?? '',
    email: process.env.AUDDIA_EMAIL ?? '',
    password: process.env.AUDDIA_PASSWORD ?? '',
    authFile: path.resolve(process.cwd(), '.auth/ravi.json'), // saved Auddia session
  },
};
