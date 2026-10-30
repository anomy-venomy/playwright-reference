import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';
export function notFoundHandler(req, res) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
}
// Express recognises error handlers by their 4-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err, _req, res, _next) {
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
        return;
    }
    if (err instanceof ZodError) {
        const details = {};
        for (const issue of err.issues) {
            const key = issue.path.join('.') || '_';
            details[key] ??= issue.message;
        }
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
        return;
    }
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 2 MB.' : err.message;
        res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
        return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with this value already exists' } });
        return;
    }
    // Malformed JSON body
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } });
        return;
    }
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' } });
}
