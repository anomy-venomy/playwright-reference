export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

/** Body for POST /employees and PUT /employees/:id */
export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  employeeCode: string; // EMP-1234
  departmentId: number;
  roleId: number; // must belong to departmentId
  employmentType: EmploymentType;
  joiningDate: string; // YYYY-MM-DD
  salary: number;
  status: EmployeeStatus;
  managerId?: number | null;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  skills: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

/** What the API returns for an employee */
export interface Employee extends Omit<EmployeeInput, 'departmentId' | 'roleId' | 'managerId'> {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  department: { id: number; name: string };
  role: { id: number; name: string };
  manager: { id: number; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: number;
  role?: number;
  status?: EmployeeStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeListResponse {
  data: Employee[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
