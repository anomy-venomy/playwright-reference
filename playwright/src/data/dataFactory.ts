import { faker } from '@faker-js/faker';
import { EmployeeInput } from '@api/models/employee.model';

const unique = () => `${Date.now()}${faker.string.numeric(4)}`;
const phone = () => `+91${faker.string.numeric({ length: 10, allowLeadingZeros: false })}`;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Builders for unique, realistic test data – safe for parallel runs */
export const DataFactory = {
  /** A valid employee. Email and code are unique per call, so parallel tests never clash. */
  employee(overrides: Partial<EmployeeInput> = {}): EmployeeInput {
    const firstName = faker.person.firstName().replace(/[^A-Za-z]/g, '') || 'Auto';
    const lastName = faker.person.lastName().replace(/[^A-Za-z]/g, '') || 'Tester';
    return {
      firstName,
      lastName,
      email: `auto.${unique()}@workflow.test`,
      phone: phone(),
      dateOfBirth: isoDate(faker.date.birthdate({ mode: 'age', min: 22, max: 55 })),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER'] as const),
      // 6-digit codes stay clear of the seeded EMP-1001..EMP-1025
      employeeCode: `EMP-${faker.number.int({ min: 100000, max: 999999 })}`,
      departmentId: 1, // Engineering
      roleId: 3, // QA Engineer (belongs to Engineering)
      employmentType: 'FULL_TIME',
      joiningDate: isoDate(faker.date.recent({ days: 365 })),
      salary: faker.number.int({ min: 500000, max: 2500000 }),
      status: 'ACTIVE',
      managerId: null,
      address: faker.location.streetAddress(),
      country: 'India',
      state: 'Rajasthan',
      city: 'Jaipur',
      pincode: '302001',
      skills: ['TypeScript', 'SQL'],
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: phone(),
      ...overrides,
    };
  },

  invalidCredentials() {
    return { email: faker.internet.email().toLowerCase(), password: faker.internet.password({ length: 12 }) };
  },
};
