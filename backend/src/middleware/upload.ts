import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { badRequest } from '../utils/httpError.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(badRequest('Only JPG, PNG, WEBP or GIF images are allowed'));
  },
});
