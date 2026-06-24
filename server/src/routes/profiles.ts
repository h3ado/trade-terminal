import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/me', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: 'Profile not found' }); return; }
  res.json(user);
});

router.patch('/me', async (req: AuthRequest, res) => {
  const { displayName, avatarUrl } = req.body as { displayName?: string; avatarUrl?: string };
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { displayName, avatarUrl },
    select: { id: true, email: true, displayName: true, avatarUrl: true, updatedAt: true },
  });
  res.json(user);
});

export default router;
