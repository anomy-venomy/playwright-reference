import { request } from './api';
import type { User } from '../types';

export interface SignupInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const authService = {
  me: () => request<{ data: User }>('/auth/me').then((r) => r.data),
  login: (input: LoginInput) => request<{ data: User }>('/auth/login', { method: 'POST', body: input }).then((r) => r.data),
  signup: (input: SignupInput) => request<{ data: User }>('/auth/signup', { method: 'POST', body: input }).then((r) => r.data),
  logout: () => request<unknown>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ data: { message: string } }>('/auth/forgot-password', { method: 'POST', body: { email } }).then((r) => r.data),
};
