import { z } from 'zod';
import { email, personName } from './common.js';
export const signupSchema = z
    .object({
    firstName: personName('First name'),
    lastName: personName('Last name'),
    email,
    password: z
        .string({ error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must be at most 72 characters')
        .regex(/[A-Za-z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string({ error: 'Please confirm your password' }),
    acceptTerms: z.literal(true, { error: 'You must accept the terms and conditions' }),
})
    .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
    // Run even when other fields are invalid, so the user sees every error at once.
    when: ({ value }) => {
        const v = value;
        return typeof v.password === 'string' && typeof v.confirmPassword === 'string';
    },
});
export const loginSchema = z.object({
    email,
    password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
});
export const forgotPasswordSchema = z.object({ email });
