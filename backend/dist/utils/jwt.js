import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const AUTH_COOKIE = 'wf_token';
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 1 day
export const REMEMBER_ME_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export function signToken(userId, rememberMe) {
    return jwt.sign({ sub: userId }, env.jwtSecret, {
        expiresIn: rememberMe ? REMEMBER_ME_TTL_SECONDS : SESSION_TTL_SECONDS,
    });
}
export function verifyToken(token) {
    try {
        const payload = jwt.verify(token, env.jwtSecret);
        if (typeof payload === 'object' && payload.sub !== undefined)
            return { sub: Number(payload.sub) };
        return null;
    }
    catch {
        return null;
    }
}
