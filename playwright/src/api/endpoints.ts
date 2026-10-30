/** Single source of truth for API routes (relative to API_BASE_URL, which already ends in /api) */
export const Endpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  employees: {
    base: '/employees',
    byId: (id: number) => `/employees/${id}`,
    nextCode: '/employees/next-code',
  },
} as const;
