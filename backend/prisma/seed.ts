/**
 * Seeds the database with predictable data for manual and automated testing.
 * Running it again wipes and recreates everything, so the data is always the same.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEPARTMENTS } from '../src/data/departments.js';

const prisma = new PrismaClient();

type SeedEmployee = {
  code: string;
  first: string;
  last: string;
  dept: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  joined: string;
  salary: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  country: string;
  state: string;
  city: string;
  skills: string[];
  manager?: string; // employeeCode of manager
};

// Managers come first so later rows can reference them.
const EMPLOYEES: SeedEmployee[] = [
  { code: 'EMP-1001', first: 'John', last: 'Doe', dept: 'Engineering', role: 'Engineering Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2019-04-15', salary: 2400000, gender: 'MALE', dob: '1985-06-12', country: 'India', state: 'Rajasthan', city: 'Jaipur', skills: ['Leadership', 'TypeScript', 'AWS'] },
  { code: 'EMP-1002', first: 'Priya', last: 'Sharma', dept: 'Design', role: 'Design Lead', status: 'ACTIVE', type: 'FULL_TIME', joined: '2020-01-06', salary: 2100000, gender: 'FEMALE', dob: '1988-11-02', country: 'India', state: 'Karnataka', city: 'Bengaluru', skills: ['Figma', 'Leadership'] },
  { code: 'EMP-1003', first: 'Michael', last: 'Brown', dept: 'Sales', role: 'Sales Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2018-09-10', salary: 2000000, gender: 'MALE', dob: '1983-03-25', country: 'United States', state: 'Texas', city: 'Austin', skills: ['Sales', 'Leadership', 'Communication'] },
  { code: 'EMP-1004', first: 'Emma', last: 'Wilson', dept: 'Human Resources', role: 'HR Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2019-07-01', salary: 1800000, gender: 'FEMALE', dob: '1987-08-19', country: 'United Kingdom', state: 'England', city: 'London', skills: ['Recruiting', 'Communication'] },
  { code: 'EMP-1005', first: 'Rahul', last: 'Verma', dept: 'Finance', role: 'Finance Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2020-03-16', salary: 1900000, gender: 'MALE', dob: '1986-01-30', country: 'India', state: 'Maharashtra', city: 'Mumbai', skills: ['Accounting', 'Leadership'] },
  { code: 'EMP-1006', first: 'Sarah', last: 'Johnson', dept: 'Engineering', role: 'Senior Software Engineer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2021-02-01', salary: 1800000, gender: 'FEMALE', dob: '1991-05-14', country: 'United States', state: 'California', city: 'San Francisco', skills: ['React', 'TypeScript', 'Node.js'], manager: 'EMP-1001' },
  { code: 'EMP-1007', first: 'Amit', last: 'Patel', dept: 'Engineering', role: 'Software Engineer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2022-06-20', salary: 1200000, gender: 'MALE', dob: '1995-09-08', country: 'India', state: 'Rajasthan', city: 'Jaipur', skills: ['JavaScript', 'React', 'SQL'], manager: 'EMP-1001' },
  { code: 'EMP-1008', first: 'Lisa', last: 'Chen', dept: 'Engineering', role: 'QA Engineer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2022-01-10', salary: 1100000, gender: 'FEMALE', dob: '1994-12-21', country: 'United States', state: 'New York', city: 'New York City', skills: ['TypeScript', 'SQL'], manager: 'EMP-1001' },
  { code: 'EMP-1009', first: 'David', last: 'Miller', dept: 'Engineering', role: 'Software Engineer', status: 'INACTIVE', type: 'CONTRACT', joined: '2021-11-01', salary: 900000, gender: 'MALE', dob: '1993-04-03', country: 'Germany', state: 'Berlin', city: 'Berlin', skills: ['Java', 'Docker'], manager: 'EMP-1001' },
  { code: 'EMP-1010', first: 'Ananya', last: 'Iyer', dept: 'Design', role: 'Product Designer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2023-03-13', salary: 1300000, gender: 'FEMALE', dob: '1996-07-27', country: 'India', state: 'Karnataka', city: 'Bengaluru', skills: ['Figma'], manager: 'EMP-1002' },
  { code: 'EMP-1011', first: 'James', last: 'Taylor', dept: 'Design', role: 'UX Researcher', status: 'INACTIVE', type: 'PART_TIME', joined: '2021-08-23', salary: 700000, gender: 'MALE', dob: '1992-02-11', country: 'United Kingdom', state: 'Scotland', city: 'Edinburgh', skills: ['Communication', 'Figma'], manager: 'EMP-1002' },
  { code: 'EMP-1012', first: 'Olivia', last: 'Martin', dept: 'Marketing', role: 'Marketing Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2020-10-05', salary: 1700000, gender: 'FEMALE', dob: '1989-10-16', country: 'United States', state: 'New York', city: 'Buffalo', skills: ['Communication', 'Project Management'] },
  { code: 'EMP-1013', first: 'Vikram', last: 'Singh', dept: 'Marketing', role: 'Marketing Specialist', status: 'ACTIVE', type: 'FULL_TIME', joined: '2023-01-09', salary: 950000, gender: 'MALE', dob: '1997-06-01', country: 'India', state: 'Delhi', city: 'New Delhi', skills: ['Communication'], manager: 'EMP-1012' },
  { code: 'EMP-1014', first: 'Sophia', last: 'Garcia', dept: 'Marketing', role: 'Content Writer', status: 'ACTIVE', type: 'CONTRACT', joined: '2024-02-19', salary: 600000, gender: 'FEMALE', dob: '1998-03-22', country: 'United States', state: 'California', city: 'Los Angeles', skills: ['Communication'], manager: 'EMP-1012' },
  { code: 'EMP-1015', first: 'Daniel', last: 'Anderson', dept: 'Sales', role: 'Account Manager', status: 'ACTIVE', type: 'FULL_TIME', joined: '2021-05-17', salary: 1250000, gender: 'MALE', dob: '1990-11-30', country: 'United States', state: 'Texas', city: 'Dallas', skills: ['Sales', 'Communication'], manager: 'EMP-1003' },
  { code: 'EMP-1016', first: 'Neha', last: 'Gupta', dept: 'Sales', role: 'Sales Executive', status: 'INACTIVE', type: 'FULL_TIME', joined: '2022-09-12', salary: 800000, gender: 'FEMALE', dob: '1996-01-18', country: 'India', state: 'Maharashtra', city: 'Pune', skills: ['Sales'], manager: 'EMP-1003' },
  { code: 'EMP-1017', first: 'Thomas', last: 'Moore', dept: 'Sales', role: 'Sales Executive', status: 'ACTIVE', type: 'FULL_TIME', joined: '2023-07-03', salary: 820000, gender: 'MALE', dob: '1995-05-09', country: 'United Kingdom', state: 'England', city: 'Manchester', skills: ['Sales', 'Communication'], manager: 'EMP-1003' },
  { code: 'EMP-1018', first: 'Kavya', last: 'Reddy', dept: 'Human Resources', role: 'Recruiter', status: 'ACTIVE', type: 'FULL_TIME', joined: '2022-04-04', salary: 850000, gender: 'FEMALE', dob: '1994-08-14', country: 'India', state: 'Karnataka', city: 'Mysuru', skills: ['Recruiting', 'Communication'], manager: 'EMP-1004' },
  { code: 'EMP-1019', first: 'William', last: 'Clark', dept: 'Human Resources', role: 'HR Generalist', status: 'ACTIVE', type: 'PART_TIME', joined: '2024-05-06', salary: 500000, gender: 'MALE', dob: '1993-12-05', country: 'United Kingdom', state: 'England', city: 'Birmingham', skills: ['Communication'], manager: 'EMP-1004' },
  { code: 'EMP-1020', first: 'Arjun', last: 'Mehta', dept: 'Finance', role: 'Accountant', status: 'ACTIVE', type: 'FULL_TIME', joined: '2021-12-13', salary: 900000, gender: 'MALE', dob: '1992-07-07', country: 'India', state: 'Maharashtra', city: 'Mumbai', skills: ['Accounting', 'SQL'], manager: 'EMP-1005' },
  { code: 'EMP-1021', first: 'Mia', last: 'Schmidt', dept: 'Finance', role: 'Financial Analyst', status: 'INACTIVE', type: 'CONTRACT', joined: '2022-10-24', salary: 1000000, gender: 'FEMALE', dob: '1991-09-29', country: 'Germany', state: 'Bavaria', city: 'Munich', skills: ['Accounting', 'Python'], manager: 'EMP-1005' },
  { code: 'EMP-1022', first: 'Rohan', last: 'Kapoor', dept: 'Engineering', role: 'Software Engineer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2024-08-01', salary: 1150000, gender: 'MALE', dob: '1998-10-10', country: 'India', state: 'Delhi', city: 'New Delhi', skills: ['Python', 'Docker', 'AWS'], manager: 'EMP-1001' },
  { code: 'EMP-1023', first: 'Emily', last: 'Davis', dept: 'Engineering', role: 'QA Engineer', status: 'ACTIVE', type: 'CONTRACT', joined: '2025-01-15', salary: 950000, gender: 'FEMALE', dob: '1997-02-26', country: 'United States', state: 'California', city: 'San Diego', skills: ['JavaScript', 'SQL'], manager: 'EMP-1001' },
  { code: 'EMP-1024', first: 'Alex', last: 'Kim', dept: 'Design', role: 'Product Designer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2025-03-03', salary: 1250000, gender: 'OTHER', dob: '1996-04-17', country: 'Germany', state: 'Bavaria', city: 'Nuremberg', skills: ['Figma', 'Communication'], manager: 'EMP-1002' },
  { code: 'EMP-1025', first: 'Meera', last: 'Joshi', dept: 'Engineering', role: 'Software Engineer', status: 'ACTIVE', type: 'FULL_TIME', joined: '2025-06-02', salary: 1100000, gender: 'FEMALE', dob: '1999-01-04', country: 'India', state: 'Rajasthan', city: 'Udaipur', skills: ['React', 'TypeScript'], manager: 'EMP-1001' },
];

async function main() {
  console.log('Clearing existing data...');
  await prisma.employee.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  // Reset AUTOINCREMENT counters so IDs are identical after every seed (e.g. John Doe is always /employees/1).
  await prisma.$executeRawUnsafe(
    `DELETE FROM sqlite_sequence WHERE name IN ('User', 'Department', 'Role', 'Employee')`,
  );

  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('Test@12345', 10);
  const admin = await prisma.user.create({
    data: { firstName: 'Test', lastName: 'User', email: 'test.user@example.com', passwordHash, phone: '+919876543210', role: 'ADMIN' },
  });
  await prisma.user.create({
    data: { firstName: 'Viewer', lastName: 'User', email: 'viewer.user@example.com', passwordHash, role: 'VIEWER' },
  });

  console.log('Creating departments and roles...');
  const roleIds = new Map<string, { departmentId: number; roleId: number }>();
  for (const [deptName, roles] of Object.entries(DEPARTMENTS)) {
    const dept = await prisma.department.create({ data: { name: deptName } });
    for (const roleName of roles) {
      const role = await prisma.role.create({ data: { name: roleName, departmentId: dept.id } });
      roleIds.set(`${deptName}|${roleName}`, { departmentId: dept.id, roleId: role.id });
    }
  }

  console.log('Creating employees...');
  const employeeIds = new Map<string, number>();
  for (const [index, e] of EMPLOYEES.entries()) {
    const ids = roleIds.get(`${e.dept}|${e.role}`);
    if (!ids) throw new Error(`Unknown role ${e.role} in ${e.dept}`);
    const created = await prisma.employee.create({
      data: {
        employeeCode: e.code,
        firstName: e.first,
        lastName: e.last,
        email: `${e.first}.${e.last}@workflow.test`.toLowerCase(),
        phone: `+91987650${String(1000 + index).padStart(4, '0')}`,
        dateOfBirth: new Date(e.dob),
        gender: e.gender,
        departmentId: ids.departmentId,
        roleId: ids.roleId,
        employmentType: e.type,
        joiningDate: new Date(e.joined),
        salary: e.salary,
        status: e.status,
        managerId: e.manager ? employeeIds.get(e.manager) : null,
        address: `${100 + index} Main Street`,
        country: e.country,
        state: e.state,
        city: e.city,
        pincode: String(302001 + index),
        skills: JSON.stringify(e.skills),
        emergencyContactName: `${e.first} Emergency Contact`,
        emergencyContactPhone: `+91912340${String(1000 + index).padStart(4, '0')}`,
        createdById: admin.id,
        // Spread creation times so "recent employees" ordering is deterministic.
        createdAt: new Date(Date.UTC(2025, 0, 1, 0, index)),
      },
    });
    employeeIds.set(e.code, created.id);
  }

  console.log(`Seeded 2 users, ${Object.keys(DEPARTMENTS).length} departments, ${EMPLOYEES.length} employees.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
