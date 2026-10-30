/** Central tag constants – avoids typos like '@smok' silently skipping tests */
export const Tag = {
  smoke: '@smoke',
  regression: '@regression',
  negative: '@negative',
  auth: '@auth',
  artists: '@artists',
  tracks: '@tracks',
  employees: '@employees', // app-specific: the reference had '@articles'
} as const;
