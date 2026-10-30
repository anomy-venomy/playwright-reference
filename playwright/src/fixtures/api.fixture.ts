import { APIRequestContext } from '@playwright/test';
import { ApiClient } from '@core/api/ApiClient';
import { AuthService } from '@api/services/AuthService';
import { EmployeeService } from '@api/services/EmployeeService';
import { config } from '@config/env.config';
import { baseTest } from './base.fixture';

export interface ApiServices {
  client: ApiClient;
  auth: AuthService;
  employees: EmployeeService;
}

/** Cookies captured after an API login (this app authenticates with the httpOnly `wf_token` cookie) */
type SessionState = Awaited<ReturnType<APIRequestContext['storageState']>>;

type ApiTestFixtures = {
  /** Logged-in (admin) services used by the test itself */
  api: ApiServices;
  /** Logged-out services – for 401 checks or logging in as another user */
  guestApi: ApiServices;
  /** Always-logged-in services for preconditions and cleanup */
  seedApi: ApiServices;
};

type ApiWorkerFixtures = {
  /** Logged in ONCE per worker, then reused by every test on that worker */
  apiSession: SessionState;
};

const buildServices = (request: APIRequestContext): ApiServices => {
  const client = new ApiClient(request);
  return { client, auth: new AuthService(client), employees: new EmployeeService(client) };
};

/** Layer 2 – API services */
export const apiTest = baseTest.extend<ApiTestFixtures, ApiWorkerFixtures>({
  apiSession: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext();
      await new AuthService(new ApiClient(request)).loginOrFail(config.user.email, config.user.password);
      const session = await request.storageState(); // holds the wf_token cookie
      await request.dispose();
      await use(session);
    },
    { scope: 'worker' },
  ],

  api: async ({ playwright, apiSession }, use) => {
    const request = await playwright.request.newContext({ storageState: apiSession });
    await use(buildServices(request));
    await request.dispose();
  },

  guestApi: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
    await use(buildServices(request));
    await request.dispose();
  },

  seedApi: async ({ playwright, apiSession, cleanup }, use) => {
    const request = await playwright.request.newContext({ storageState: apiSession });
    await use(buildServices(request));
    // Depends on `cleanup`, so this teardown runs first – while the client is still alive
    await cleanup.run();
    await request.dispose();
  },
});
