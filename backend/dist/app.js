import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
export const app = express();
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/api', router);
app.use('/api', notFoundHandler);
// In production, serve the built frontend and fall back to index.html for client-side routes.
const frontendDist = path.resolve(process.cwd(), '../frontend/dist');
if (env.isProduction && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}
app.use(errorHandler);
