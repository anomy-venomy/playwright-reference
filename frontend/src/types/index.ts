export type UserRole = 'ADMIN' | 'VIEWER';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
  departmentId: number;
}

export interface ManagerOption {
  id: number;
  employeeCode: string;
  fullName: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  avatarUrl: string | null;
  department: Department;
  role: { id: number; name: string };
  employmentType: EmploymentType;
  joiningDate: string;
  salary: number;
  status: EmployeeStatus;
  manager: ManagerOption | null;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  skills: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: string;
  updatedAt: string;
}

/** Body accepted by POST/PUT /api/employees */
export interface EmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  avatarUrl: string | null;
  employeeCode: string;
  departmentId: number;
  roleId: number;
  employmentType: EmploymentType;
  joiningDate: string;
  salary: number;
  status: EmployeeStatus;
  managerId: number | null;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  skills: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EmployeeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: { id: number; name: string; count: number }[];
  recentEmployees: Employee[];
}

export type Locations = Record<string, Record<string, string[]>>;
