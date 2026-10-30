export function toUserDTO(u) {
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
