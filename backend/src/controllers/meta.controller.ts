import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { LOCATIONS } from '../data/locations.js';
import { SKILLS } from '../data/skills.js';
import { dashboardStats } from '../services/employee.service.js';

export async function departments(_req: Request, res: Response) {
  res.json({ data: await prisma.department.findMany({ orderBy: { name: 'asc' } }) });
}

/** GET /api/roles?departmentId=1 — optionally filtered by department. */
export async function roles(req: Request, res: Response) {
  const departmentId = Number(req.query.departmentId) || undefined;
  const data = await prisma.role.findMany({
    where: departmentId ? { departmentId } : undefined,
    orderBy: { name: 'asc' },
  });
  res.json({ data });
}

export function locations(_req: Request, res: Response) {
  res.json({ data: LOCATIONS });
}

export function skills(_req: Request, res: Response) {
  res.json({ data: SKILLS });
}

export async function stats(_req: Request, res: Response) {
  res.json({ data: await dashboardStats() });
}
