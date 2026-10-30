import { request, toQueryString } from './api';
import type { Employee, EmployeeListParams, EmployeePayload, ManagerOption, PaginationMeta } from '../types';

export const employeeService = {
  list: (params: EmployeeListParams, signal?: AbortSignal) =>
    request<{ data: Employee[]; meta: PaginationMeta }>(`/employees${toQueryString({ ...params })}`, { signal }),
  get: (id: number | string, signal?: AbortSignal) =>
    request<{ data: Employee }>(`/employees/${id}`, { signal }).then((r) => r.data),
  create: (payload: EmployeePayload) =>
    request<{ data: Employee }>('/employees', { method: 'POST', body: payload }).then((r) => r.data),
  update: (id: number | string, payload: EmployeePayload) =>
    request<{ data: Employee }>(`/employees/${id}`, { method: 'PUT', body: payload }).then((r) => r.data),
  remove: (id: number | string) => request<unknown>(`/employees/${id}`, { method: 'DELETE' }),
  managers: () => request<{ data: ManagerOption[] }>('/employees/managers').then((r) => r.data),
  nextCode: () => request<{ data: { employeeCode: string } }>('/employees/next-code').then((r) => r.data.employeeCode),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return request<{ data: { url: string } }>('/uploads/avatar', { method: 'POST', body: form }).then((r) => r.data.url);
  },
};
