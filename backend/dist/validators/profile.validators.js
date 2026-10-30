import { z } from 'zod';
import { PHONE_REGEX, personName } from './common.js';
export const profileSchema = z.object({
    firstName: personName('First name'),
    lastName: personName('Last name'),
    phone: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((v) => (v ? v : null))
        .refine((v) => v === null || PHONE_REGEX.test(v), 'Phone must be 10–15 digits, optionally starting with +'),
});
