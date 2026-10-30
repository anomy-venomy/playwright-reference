import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { toUserDTO } from '../utils/userDto.js';
import { profileSchema } from '../validators/profile.validators.js';

export async function updateProfile(req: Request, res: Response) {
  const input = profileSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: input });
  res.json({ data: toUserDTO(user) });
}
