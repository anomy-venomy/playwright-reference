/** Auddia stage routes, relative to AUDDIA_API_URL (which already ends in /api) */
export const AuddiaEndpoints = {
  login: '/auth/login',
  profile: '/users/profile', // POST { userid } – yes, a POST that reads
  manageProfile: '/users/manage-profile', // POST full profile – update
} as const;

/** localStorage keys the web app reads to decide "logged in" (dsc_* values are JSON-encoded strings) */
export const TOKEN_STORAGE_KEY = 'dsc_token'; // the real JWT
export const REFRESH_TOKEN_STORAGE_KEY = 'dsc_refreshToken';
export const AUTH_STORE_KEY = 'auth-store'; // Zustand store: user + "logged in" flag