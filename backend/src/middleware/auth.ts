import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** Rejects the request with 401 unless it carries a valid session cookie for an existing user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  const payload = token ? verifyToken(token) : null;
  if (!payload) throw unauthorized();

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized();

  req.user = user;
  next();
}

/** Must run after requireAuth. Rejects with 403 if the user's role is not allowed. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw forbidden();
    next();
  };
}
