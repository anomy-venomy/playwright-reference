/** Validation rules shared by forms. They mirror the backend's zod rules so errors match. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;
export const NAME_PATTERN = /^[A-Za-z][A-Za-z '.-]*$/;
export const EMPLOYEE_CODE_PATTERN = /^EMP-\d{4,6}$/i;
export const PINCODE_PATTERN = /^[A-Za-z0-9 -]{4,10}$/;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const nameRules = (label: string) => ({
  required: `${label} is required`,
  maxLength: { value: 50, message: `${label} must be at most 50 characters` },
  pattern: { value: NAME_PATTERN, message: `${label} can only contain letters, spaces, apostrophes, dots and hyphens` },
});

export const emailRules = {
  required: 'Email is required',
  pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
};

export const phoneRules = (label = 'Phone', required = true) => ({
  ...(required ? { required: `${label} is required` } : {}),
  pattern: { value: PHONE_PATTERN, message: `${label} must be 10–15 digits, optionally starting with +` },
});

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP or GIF images are allowed';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 2 MB or smaller';
  return null;
}
