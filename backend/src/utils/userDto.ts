import type { User } from '@prisma/client';

export function toUserDTO(u: User) {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}
