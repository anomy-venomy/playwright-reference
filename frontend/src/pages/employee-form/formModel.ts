import type { FieldErrors, Resolver } from 'react-hook-form';
import type { Employee, EmployeePayload, EmploymentType, EmployeeStatus, Gender } from '../../types';
import { todayISO } from '../../utils/format';
import {
  EMAIL_PATTERN,
  EMPLOYEE_CODE_PATTERN,
  NAME_PATTERN,
  PHONE_PATTERN,
  PINCODE_PATTERN,
} from '../../utils/validation';

/** All form values are kept as strings (what inputs produce) and converted on submit. */
export interface EmployeeFormValues {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | '';
  // Step 2
  employeeCode: string;
  departmentId: string;
  roleId: string;
  employmentType: EmploymentType | '';
  joiningDate: string;
  salary: string;
  status: EmployeeStatus;
  managerId: string;
  // Step 3
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  skills: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export type FieldName = keyof EmployeeFormValues;

export const STEPS = [
  { title: 'Personal Information', short: 'Personal' },
  { title: 'Professional Information', short: 'Professional' },
  { title: 'Address & Additional Information', short: 'Address' },
  { title: 'Review & Submit', short: 'Review' },
] as const;

export const STEP_FIELDS: FieldName[][] = [
  ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'],
  ['employeeCode', 'departmentId', 'roleId', 'employmentType', 'joiningDate', 'salary', 'status', 'managerId'],
  ['address', 'country', 'state', 'city', 'pincode', 'skills', 'emergencyContactName', 'emergencyContactPhone'],
  [],
];

export function stepOfField(field: string): number {
  const index = STEP_FIELDS.findIndex((fields) => fields.includes(field as FieldName));
  return index === -1 ? 0 : index;
}

export const EMPTY_VALUES: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  employeeCode: '',
  departmentId: '',
  roleId: '',
  employmentType: '',
  joiningDate: '',
  salary: '',
  status: 'ACTIVE',
  managerId: '',
  address: '',
  country: '',
  state: '',
  city: '',
  pincode: '',
  skills: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export function fromEmployee(e: Employee): EmployeeFormValues {
  return {
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone,
    dateOfBirth: e.dateOfBirth,
    gender: e.gender,
    employeeCode: e.employeeCode,
    departmentId: String(e.department.id),
    roleId: String(e.role.id),
    employmentType: e.employmentType,
    joiningDate: e.joiningDate,
    salary: String(e.salary),
    status: e.status,
    managerId: e.manager ? String(e.manager.id) : '',
    address: e.address,
    country: e.country,
    state: e.state,
    city: e.city,
    pincode: e.pincode,
    skills: e.skills,
    emergencyContactName: e.emergencyContactName,
    emergencyContactPhone: e.emergencyContactPhone,
  };
}

export function toPayload(v: EmployeeFormValues, avatarUrl: string | null): EmployeePayload {
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    dateOfBirth: v.dateOfBirth,
    gender: v.gender as Gender,
    avatarUrl,
    employeeCode: v.employeeCode.trim().toUpperCase(),
    departmentId: Number(v.departmentId),
    roleId: Number(v.roleId),
    employmentType: v.employmentType as EmploymentType,
    joiningDate: v.joiningDate,
    salary: Number(v.salary),
    status: v.status,
    managerId: v.managerId ? Number(v.managerId) : null,
    address: v.address.trim(),
    country: v.country,
    state: v.state,
    city: v.city,
    pincode: v.pincode.trim(),
    skills: v.skills,
    emergencyContactName: v.emergencyContactName.trim(),
    emergencyContactPhone: v.emergencyContactPhone.trim(),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function nameError(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length > 50) return `${label} must be at most 50 characters`;
  if (!NAME_PATTERN.test(v)) return `${label} can only contain letters, spaces, apostrophes, dots and hyphens`;
}

function phoneError(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (!PHONE_PATTERN.test(v)) return `${label} must be 10–15 digits, optionally starting with +`;
}

/**
 * Validates every field, whether or not its step is currently on screen.
 * Mirrors the backend rules in backend/src/validators/employee.validators.ts.
 */
export function validateEmployee(v: EmployeeFormValues): Partial<Record<FieldName, string>> {
  const e: Partial<Record<FieldName, string>> = {};
  const today = todayISO();

  // Step 1
  e.firstName = nameError(v.firstName, 'First name');
  e.lastName = nameError(v.lastName, 'Last name');
  if (!v.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Enter a valid email address';
  e.phone = phoneError(v.phone, 'Phone');
  if (!v.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
  else if (v.dateOfBirth > today) e.dateOfBirth = 'Date of birth cannot be in the future';
  else if (v.dateOfBirth > todayISO(-18)) e.dateOfBirth = 'Employee must be at least 18 years old';
  else if (v.dateOfBirth < todayISO(-100)) e.dateOfBirth = 'Enter a realistic date of birth';
  if (!v.gender) e.gender = 'Gender is required';

  // Step 2
  if (!v.employeeCode.trim()) e.employeeCode = 'Employee ID is required';
  else if (!EMPLOYEE_CODE_PATTERN.test(v.employeeCode.trim())) e.employeeCode = 'Employee ID must look like EMP-1234';
  if (!v.departmentId) e.departmentId = 'Department is required';
  if (!v.roleId) e.roleId = 'Job role is required';
  if (!v.employmentType) e.employmentType = 'Employment type is required';
  if (!v.joiningDate) e.joiningDate = 'Joining date is required';
  else if (v.dateOfBirth && v.joiningDate < v.dateOfBirth) e.joiningDate = 'Joining date must be after date of birth';
  else {
    const limit = new Date();
    limit.setMonth(limit.getMonth() + 6);
    if (new Date(`${v.joiningDate}T00:00:00`) > limit) e.joiningDate = 'Joining date cannot be more than 6 months in the future';
  }
  const salary = Number(v.salary);
  if (!v.salary.trim()) e.salary = 'Salary is required';
  else if (!/^\d+$/.test(v.salary.trim())) e.salary = 'Salary must be a whole number';
  else if (salary < 10000) e.salary = 'Salary must be at least 10,000';
  else if (salary > 100000000) e.salary = 'Salary must be at most 100,000,000';

  // Step 3
  if (!v.address.trim()) e.address = 'Address is required';
  else if (v.address.trim().length < 5) e.address = 'Address must be at least 5 characters';
  else if (v.address.trim().length > 200) e.address = 'Address must be at most 200 characters';
  if (!v.country) e.country = 'Country is required';
  if (!v.state) e.state = 'State is required';
  if (!v.city) e.city = 'City is required';
  if (!v.pincode.trim()) e.pincode = 'Pincode is required';
  else if (!PINCODE_PATTERN.test(v.pincode.trim())) e.pincode = 'Pincode must be 4–10 letters or digits';
  if (!v.skills?.length) e.skills = 'Select at least one skill';
  else if (v.skills.length > 10) e.skills = 'Select at most 10 skills';
  e.emergencyContactName = nameError(v.emergencyContactName, 'Emergency contact name');
  e.emergencyContactPhone = phoneError(v.emergencyContactPhone, 'Emergency contact phone');
  if (!e.emergencyContactPhone && v.emergencyContactPhone.trim() === v.phone.trim()) {
    e.emergencyContactPhone = "Emergency contact phone must be different from the employee's phone";
  }

  for (const key of Object.keys(e) as FieldName[]) if (!e[key]) delete e[key];
  return e;
}

export const employeeResolver: Resolver<EmployeeFormValues> = async (values) => {
  const messages = validateEmployee(values);
  const errors: FieldErrors<EmployeeFormValues> = {};
  for (const [field, message] of Object.entries(messages)) {
    (errors as Record<string, { type: string; message: string }>)[field] = { type: 'validation', message: message! };
  }
  return Object.keys(errors).length ? { values: {}, errors } : { values, errors: {} };
};
