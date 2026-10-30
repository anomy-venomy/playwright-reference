import { prisma } from '../lib/prisma.js';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt.js';
import { forbidden, unauthorized } from '../utils/httpError.js';
/** Rejects the request with 401 unless it carries a valid session cookie for an existing user. */
export async function requireAuth(req, _res, next) {
    const token = req.cookies?.[AUTH_COOKIE];
    const payload = token ? verifyToken(token) : null;
    if (!payload)
        throw unauthorized();
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user)
        throw unauthorized();
    req.user = user;
    next();
}
/** Must run after requireAuth. Rejects with 403 if the user's role is not allowed. */
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role))
            throw forbidden();
        next();
    };
}
