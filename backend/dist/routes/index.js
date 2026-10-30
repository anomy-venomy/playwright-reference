import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { avatarUpload } from '../middleware/upload.js';
import * as auth from '../controllers/auth.controller.js';
import * as employees from '../controllers/employee.controller.js';
import * as meta from '../controllers/meta.controller.js';
import * as profile from '../controllers/profile.controller.js';
import * as upload from '../controllers/upload.controller.js';
export const router = Router();
router.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
});
// Auth (public)
router.post('/auth/signup', auth.signup);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.post('/auth/forgot-password', auth.forgotPassword);
// Everything below requires a valid session
router.use(requireAuth);
const adminOnly = requireRole('ADMIN');
router.get('/auth/me', auth.me);
router.put('/profile', profile.updateProfile);
router.get('/dashboard/stats', meta.stats);
router.get('/departments', meta.departments);
router.get('/roles', meta.roles);
router.get('/locations', meta.locations);
router.get('/skills', meta.skills);
// Specific employee paths must be registered before /employees/:id
router.get('/employees/managers', employees.managers);
router.get('/employees/next-code', adminOnly, employees.nextCode);
router.get('/employees', employees.list);
router.post('/employees', adminOnly, employees.create);
router.get('/employees/:id', employees.getOne);
router.put('/employees/:id', adminOnly, employees.update);
router.delete('/employees/:id', adminOnly, employees.remove);
router.post('/uploads/avatar', adminOnly, avatarUpload.single('avatar'), upload.uploadAvatar);
