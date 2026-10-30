import type { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AUTH_COOKIE, REMEMBER_ME_TTL_SECONDS, signToken } from '../utils/jwt.js';
import { conflict, unauthorized } from '../utils/httpError.js';
import { toUserDTO } from '../utils/userDto.js';
import { forgotPasswordSchema, loginSchema, signupSchema } from '../validators/auth.validators.js';

const baseCookie: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/',
};

function setAuthCookie(res: Response, userId: number, rememberMe: boolean) {
  res.cookie(AUTH_COOKIE, signToken(userId, rememberMe), {
    ...baseCookie,
    // Without maxAge the cookie is a session cookie and disappears when the browser closes.
    ...(rememberMe ? { maxAge: REMEMBER_ME_TTL_SECONDS * 1000 } : {}),
  });
}

export async function signup(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: input.email } })) {
    throw conflict('An account with this email already exists', { email: 'An account with this email already exists' });
  }
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });
  setAuthCookie(res, user.id, false);
  res.status(201).json({ data: toUserDTO(user) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw unauthorized('Invalid email or password');
  }
  setAuthCookie(res, user.id, input.rememberMe);
  res.json({ data: toUserDTO(user) });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, baseCookie);
  res.json({ data: { message: 'Logged out successfully' } });
}

export function me(req: Request, res: Response) {
  res.json({ data: toUserDTO(req.user!) });
}

/** No emails are actually sent; this only simulates the flow and never reveals whether an account exists. */
export function forgotPassword(req: Request, res: Response) {
  forgotPasswordSchema.parse(req.body);
  res.json({ data: { message: 'If an account exists for this email, a password reset link has been sent.' } });
}
