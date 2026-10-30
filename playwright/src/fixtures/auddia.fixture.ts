import { config } from '@config/env.config';
import { ApiClient } from '@core/api/ApiClient';
import { AuddiaService } from '@api/auddia/AuddiaService';
import { AuddiaTenant } from '@api/auddia/models';
import { readSavedSession } from '@api/auddia/session';
import { AuddiaAddArtistPage } from '@pages/auddia/AddArtistPage';
import { AuddiaAddTrackPage } from '@pages/auddia/AddTrackPage';
import { AuddiaArtistsPage } from '@pages/auddia/ArtistsPage';
import { AuddiaDashboardPage } from '@pages/auddia/DashboardPage';
import { AuddiaEditProfilePage } from '@pages/auddia/EditProfilePage';
import { AuddiaLoginPage } from '@pages/auddia/LoginPage';
import { AuddiaMyProfilePage } from '@pages/auddia/MyProfilePage';
import { baseTest } from './base.fixture';

type AuddiaFixtures = {
  /** The logged-in user from the saved session (userId, tenant_id…) */
  auddiaUser: AuddiaTenant;
  /** Logged in with the session saved by auddia-setup – no extra login call */
  auddiaApi: AuddiaService;
  /** Logged out – for login/logout tests, so the shared session is never touched */
  auddiaGuest: AuddiaService;
  /** Page objects – logged in or out depends on the storageState the test file uses */
  loginPage: AuddiaLoginPage;
  dashboardPage: AuddiaDashboardPage;
  myProfilePage: AuddiaMyProfilePage;
  editProfilePage: AuddiaEditProfilePage;
  artistsPage: AuddiaArtistsPage;
  addArtistPage: AuddiaAddArtistPage;
  addTrackPage: AuddiaAddTrackPage;
};

export const test = baseTest.extend<AuddiaFixtures>({
  auddiaUser: async ({}, use) => {
    await use(readSavedSession().tenant);
  },

  auddiaApi: async ({ playwright, cleanup }, use) => {
    const { token, tenant } = readSavedSession();
    const request = await playwright.request.newContext();
    const client = new ApiClient(request, config.auddia.apiBaseUrl, 'Bearer');
    await use(new AuddiaService(client).useSession(token, tenant));
    // Depends on `cleanup`, so restores run here – while the client is still alive
    await cleanup.run();
    await request.dispose();
  },

  auddiaGuest: async ({ playwright }, use) => {
    const request = await playwright.request.newContext();
    await use(new AuddiaService(new ApiClient(request, config.auddia.apiBaseUrl, 'Bearer')));
    await request.dispose();
  },

  loginPage: async ({ page }, use) => use(new AuddiaLoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new AuddiaDashboardPage(page)),
  myProfilePage: async ({ page }, use) => use(new AuddiaMyProfilePage(page)),
  editProfilePage: async ({ page }, use) => use(new AuddiaEditProfilePage(page)),
  artistsPage: async ({ page }, use) => use(new AuddiaArtistsPage(page)),
  addArtistPage: async ({ page }, use) => use(new AuddiaAddArtistPage(page)),
  addTrackPage: async ({ page }, use) => use(new AuddiaAddTrackPage(page)),
});

export { expect } from '@core/assertions/api.matchers';
