import { z } from 'zod';
export const NAME_REGEX = /^[A-Za-z][A-Za-z '.-]*$/;
export const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const requiredString = (label, max = 100) => z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
export const personName = (label) => requiredString(label, 50).regex(NAME_REGEX, `${label} can only contain letters, spaces, apostrophes, dots and hyphens`);
export const email = z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .transform((v) => v.toLowerCase());
export const phone = (label = 'Phone') => requiredString(label, 16).regex(PHONE_REGEX, `${label} must be 10–15 digits, optionally starting with +`);
/** A YYYY-MM-DD string, converted to a UTC Date. */
export const isoDate = (label) => requiredString(label, 10)
    .regex(DATE_REGEX, `${label} must be a valid date`)
    .refine((v) => !Number.isNaN(Date.parse(v)), `${label} must be a valid date`)
    .transform((v) => new Date(`${v}T00:00:00.000Z`));
