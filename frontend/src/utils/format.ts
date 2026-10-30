import type { EmploymentType, Gender } from '../types';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const numberFormatter = new Intl.NumberFormat('en-US');

/** "2019-04-15" or an ISO timestamp → "Apr 15, 2019" (always UTC so it never shifts a day). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export const formatNumber = (n: number) => numberFormatter.format(n);

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const STATUS_LABELS = { ACTIVE: 'Active', INACTIVE: 'Inactive' } as const;

export function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

/** Today's date in the user's timezone as YYYY-MM-DD (for <input type="date"> min/max). */
export function todayISO(offsetYears = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Only allow internal redirects like "/employees?page=2" — never "//evil.com" or absolute URLs. */
export function safeRedirect(target: string | null, fallback = '/dashboard'): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : fallback;
}
