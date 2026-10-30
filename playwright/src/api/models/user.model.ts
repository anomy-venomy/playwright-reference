export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
}
