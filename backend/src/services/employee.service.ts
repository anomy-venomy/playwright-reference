import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isValidLocation } from '../data/locations.js';
import { badRequest, conflict, notFound } from '../utils/httpError.js';
import type { EmployeeInput, ListQuery } from '../validators/employee.validators.js';

const employeeInclude = {
  department: { select: { id: true, name: true } },
  role: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} satisfies Prisma.EmployeeInclude;

type EmployeeWithRelations = Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>;

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

/** Shape returned by the API. Dates are YYYY-MM-DD strings so they drop straight into <input type="date">. */
export function toEmployeeDTO(e: EmployeeWithRelations) {
  return {
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    fullName: `${e.firstName} ${e.lastName}`,
    email: e.email,
    phone: e.phone,
    dateOfBirth: toDateString(e.dateOfBirth),
    gender: e.gender,
    avatarUrl: e.avatarUrl,
    department: e.department,
    role: e.role,
    employmentType: e.employmentType,
    joiningDate: toDateString(e.joiningDate),
    salary: e.salary,
    status: e.status,
    manager: e.manager
      ? { id: e.manager.id, employeeCode: e.manager.employeeCode, fullName: `${e.manager.firstName} ${e.manager.lastName}` }
      : null,
    address: e.address,
    country: e.country,
    state: e.state,
    city: e.city,
    pincode: e.pincode,
    skills: JSON.parse(e.skills) as string[],
    emergencyContactName: e.emergencyContactName,
    emergencyContactPhone: e.emergencyContactPhone,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function buildOrderBy(sortBy: ListQuery['sortBy'], dir: ListQuery['sortOrder']): Prisma.EmployeeOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'name':
      return [{ firstName: dir }, { lastName: dir }];
    case 'department':
      return [{ department: { name: dir } }, { employeeCode: 'asc' }];
    case 'role':
      return [{ role: { name: dir } }, { employeeCode: 'asc' }];
    default:
      return [{ [sortBy]: dir }, { employeeCode: 'asc' }];
  }
}

export async function listEmployees(q: ListQuery) {
  const where: Prisma.EmployeeWhereInput = {};
  if (q.department) where.departmentId = q.department;
  if (q.role) where.roleId = q.role;
  if (q.status) where.status = q.status;

  if (q.search) {
    // SQLite LIKE is case-insensitive for ASCII, so `contains` behaves as a case-insensitive search.
    const terms = q.search.split(/\s+/).filter(Boolean);
    where.AND = terms.map((term) => ({
      OR: [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
        { employeeCode: { contains: term } },
      ],
    }));
  }

  const [total, rows] = await prisma.$transaction([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: employeeInclude,
      orderBy: buildOrderBy(q.sortBy, q.sortOrder),
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);

  return {
    data: rows.map(toEmployeeDTO),
    meta: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  };
}

export async function getEmployee(id: number) {
  const employee = await prisma.employee.findUnique({ where: { id }, include: employeeInclude });
  if (!employee) throw notFound('Employee not found');
  return toEmployeeDTO(employee);
}

/** Business rules that need the database (or reference data) to check. */
async function assertConsistent(input: EmployeeInput, existingId?: number) {
  const errors: Record<string, string> = {};

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!department) errors.departmentId = 'Department does not exist';
  if (!role) errors.roleId = 'Job role does not exist';
  else if (role.departmentId !== input.departmentId) errors.roleId = 'Job role does not belong to the selected department';

  if (input.managerId) {
    if (input.managerId === existingId) errors.managerId = 'An employee cannot be their own manager';
    else if (!(await prisma.employee.findUnique({ where: { id: input.managerId } }))) errors.managerId = 'Manager does not exist';
  }

  if (!isValidLocation(input.country, input.state, input.city)) {
    errors.city = 'Select a valid country, state and city combination';
  }

  if (Object.keys(errors).length) throw badRequest('Validation failed', errors);

  const duplicates: Record<string, string> = {};
  const notSelf = existingId ? { NOT: { id: existingId } } : {};
  if (await prisma.employee.findFirst({ where: { email: input.email, ...notSelf } })) {
    duplicates.email = 'An employee with this email already exists';
  }
  if (await prisma.employee.findFirst({ where: { employeeCode: input.employeeCode, ...notSelf } })) {
    duplicates.employeeCode = 'This Employee ID is already in use';
  }
  if (Object.keys(duplicates).length) throw conflict(Object.values(duplicates)[0], duplicates);
}

function toData(input: EmployeeInput) {
  const { skills, managerId, avatarUrl, ...rest } = input;
  return { ...rest, skills: JSON.stringify(skills), managerId: managerId ?? null, avatarUrl: avatarUrl ?? null };
}

export async function createEmployee(input: EmployeeInput, createdById: number) {
  await assertConsistent(input);
  const employee = await prisma.employee.create({
    data: { ...toData(input), createdById },
    include: employeeInclude,
  });
  return toEmployeeDTO(employee);
}

export async function updateEmployee(id: number, input: EmployeeInput) {
  if (!(await prisma.employee.findUnique({ where: { id } }))) throw notFound('Employee not found');
  await assertConsistent(input, id);
  const employee = await prisma.employee.update({ where: { id }, data: toData(input), include: employeeInclude });
  return toEmployeeDTO(employee);
}

export async function deleteEmployee(id: number) {
  if (!(await prisma.employee.findUnique({ where: { id } }))) throw notFound('Employee not found');
  await prisma.employee.delete({ where: { id } });
}

/** Suggests the next free code: EMP-<highest number + 1>. */
export async function nextEmployeeCode() {
  const codes = await prisma.employee.findMany({ select: { employeeCode: true } });
  const max = codes.reduce((m, { employeeCode }) => Math.max(m, Number(employeeCode.split('-')[1]) || 0), 1000);
  return `EMP-${max + 1}`;
}

export async function listManagers() {
  const rows = await prisma.employee.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, employeeCode: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
  return rows.map((r) => ({ id: r.id, employeeCode: r.employeeCode, fullName: `${r.firstName} ${r.lastName}` }));
}

export async function dashboardStats() {
  const [total, active, byDepartment, recent] = await prisma.$transaction([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.department.findMany({ select: { id: true, name: true, _count: { select: { employees: true } } }, orderBy: { name: 'asc' } }),
    prisma.employee.findMany({ include: employeeInclude, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 5 }),
  ]);
  return {
    totalEmployees: total,
    activeEmployees: active,
    inactiveEmployees: total - active,
    byDepartment: byDepartment.map((d) => ({ id: d.id, name: d.name, count: d._count.employees })),
    recentEmployees: recent.map(toEmployeeDTO),
  };
}
