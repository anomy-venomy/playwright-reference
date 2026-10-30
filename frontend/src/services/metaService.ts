import { request, toQueryString } from './api';
import type { DashboardStats, Department, Locations, Role, User } from '../types';

export const metaService = {
  departments: () => request<{ data: Department[] }>('/departments').then((r) => r.data),
  roles: (departmentId?: number | string) =>
    request<{ data: Role[] }>(`/roles${toQueryString({ departmentId })}`).then((r) => r.data),
  locations: () => request<{ data: Locations }>('/locations').then((r) => r.data),
  skills: () => request<{ data: string[] }>('/skills').then((r) => r.data),
  dashboardStats: () => request<{ data: DashboardStats }>('/dashboard/stats').then((r) => r.data),
};

export const profileService = {
  update: (input: { firstName: string; lastName: string; phone: string | null }) =>
    request<{ data: User }>('/profile', { method: 'PUT', body: input }).then((r) => r.data),
};
