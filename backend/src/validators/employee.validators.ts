import { z } from 'zod';
import { SKILLS } from '../data/skills.js';
import { email, isoDate, personName, phone, requiredString } from './common.js';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'] as const;
export const STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const SORT_FIELDS = ['employeeCode', 'name', 'email', 'department', 'role', 'status', 'joiningDate', 'createdAt'] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

const id = (label: string) =>
  z.coerce.number({ error: `${label} is required` }).int().positive(`${label} is required`);

export const employeeSchema = z
  .object({
    // Step 1 — personal
    firstName: personName('First name'),
    lastName: personName('Last name'),
    email,
    phone: phone('Phone'),
    dateOfBirth: isoDate('Date of birth'),
    gender: z.enum(GENDERS, { error: 'Gender is required' }),
    avatarUrl: z
      .string()
      .regex(/^\/uploads\/[\w-]+\.(jpg|png|webp|gif)$/, 'Invalid avatar URL')
      .nullable()
      .optional(),

    // Step 2 — professional
    employeeCode: requiredString('Employee ID', 12)
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(/^EMP-\d{4,6}$/, 'Employee ID must look like EMP-1234')),
    departmentId: id('Department'),
    roleId: id('Job role'),
    employmentType: z.enum(EMPLOYMENT_TYPES, { error: 'Employment type is required' }),
    joiningDate: isoDate('Joining date'),
    salary: z.coerce
      .number({ error: 'Salary is required' })
      .int('Salary must be a whole number')
      .min(10000, 'Salary must be at least 10,000')
      .max(100000000, 'Salary must be at most 100,000,000'),
    status: z.enum(STATUSES, { error: 'Status is required' }).default('ACTIVE'),
    managerId: z.coerce.number().int().positive().nullable().optional(),

    // Step 3 — address & additional
    address: requiredString('Address', 200).min(5, 'Address must be at least 5 characters'),
    country: requiredString('Country'),
    state: requiredString('State'),
    city: requiredString('City'),
    pincode: requiredString('Pincode', 10).regex(/^[A-Za-z0-9 -]{4,10}$/, 'Pincode must be 4–10 letters or digits'),
    skills: z
      .array(z.enum(SKILLS, { error: 'Unknown skill' }), { error: 'Select at least one skill' })
      .min(1, 'Select at least one skill')
      .max(10, 'Select at most 10 skills'),
    emergencyContactName: personName('Emergency contact name'),
    emergencyContactPhone: phone('Emergency contact phone'),
  })
  .superRefine((d, ctx) => {
    const now = Date.now();
    const ageYears = (now - d.dateOfBirth.getTime()) / (365.25 * DAY_MS);
    if (d.dateOfBirth.getTime() > now) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Date of birth cannot be in the future' });
    } else if (ageYears < 18) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Employee must be at least 18 years old' });
    } else if (ageYears > 100) {
      ctx.addIssue({ code: 'custom', path: ['dateOfBirth'], message: 'Enter a realistic date of birth' });
    }
    if (d.joiningDate.getTime() > now + 180 * DAY_MS) {
      ctx.addIssue({ code: 'custom', path: ['joiningDate'], message: 'Joining date cannot be more than 6 months in the future' });
    }
    if (d.joiningDate.getTime() < d.dateOfBirth.getTime()) {
      ctx.addIssue({ code: 'custom', path: ['joiningDate'], message: 'Joining date must be after date of birth' });
    }
    if (d.emergencyContactPhone === d.phone) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyContactPhone'],
        message: "Emergency contact phone must be different from the employee's phone",
      });
    }
  });

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  department: z.coerce.number().int().positive().optional(),
  role: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUSES).optional(),
  sortBy: z.enum(SORT_FIELDS).default('employeeCode'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
