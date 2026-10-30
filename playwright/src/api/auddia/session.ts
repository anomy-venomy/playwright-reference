import fs from 'fs';
import path from 'path';
import { APIRequestContext } from '@playwright/test';
import { config } from '@config/env.config';
import { AUTH_STORE_KEY, REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from './endpoints';
import { AuddiaLoginData, AuddiaProfile, AuddiaTenant } from './models';

type SavedState = { origins: { origin: string; localStorage: { name: string; value: string }[] }[] };

/** Same JSON the web app's Zustand store persists under `auth-store` */
function buildAuthStore(login: AuddiaLoginData, profile: AuddiaProfile): string {
  return JSON.stringify({
    state: {
      token: 'true', // only a "logged in" flag – the real JWT lives in dsc_token
      user: {
        userId: login.userId,
        tenant_id: login.tenant_id,
        subtenant_id: login.subtenant_id,
        account_type: login.account_type,
        accountType: login.account_type,
        firstname: profile.firstname,
        lastname: profile.lastname,
        email: profile.email,
        organisation: profile.organisation,
        isProfileComplete: true,
        profileDataLoaded: true,
        // This test account's real payment state, copied from the browser
        isCardAdded: true,
        hasPaymentMethod: true,
        hasBillingAddress: true,
      },
    },
    version: 0,
  });
}

/**
 * Writes a Playwright storageState file: cookies from the API login + the localStorage keys the app reads.
 * Browser tests load it and open already logged in.
 */
export async function saveSession(
  request: APIRequestContext,
  login: AuddiaLoginData,
  profile: AuddiaProfile,
): Promise<void> {
  const { uiBaseUrl, authFile } = config.auddia;
  const state = await request.storageState();
  state.origins.push({
    origin: new URL(uiBaseUrl).origin,
    // The app stores tokens with JSON.stringify and reads them with JSON.parse – a raw token reads as "logged out"
    localStorage: [
      { name: TOKEN_STORAGE_KEY, value: JSON.stringify(login.token) },
      { name: REFRESH_TOKEN_STORAGE_KEY, value: JSON.stringify(login.refresh_token) },
      { name: AUTH_STORE_KEY, value: buildAuthStore(login, profile) },
    ],
  });
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));
}

/** Token + tenant from the saved file – lets API tests reuse the same login */
export function readSavedSession(): { token: string; tenant: AuddiaTenant } {
  const state = JSON.parse(fs.readFileSync(config.auddia.authFile, 'utf-8')) as SavedState;
  const items = state.origins.flatMap((o) => o.localStorage);
  const token = items.find((i) => i.name === TOKEN_STORAGE_KEY)?.value;
  const store = items.find((i) => i.name === AUTH_STORE_KEY)?.value;
  if (!token || !store) throw new Error('No Auddia session saved – run the auddia-setup project first');
  const { userId, tenant_id, subtenant_id, account_type } = JSON.parse(store).state.user as AuddiaTenant;
  return { token: JSON.parse(token) as string, tenant: { userId, tenant_id, subtenant_id, account_type } };
}
