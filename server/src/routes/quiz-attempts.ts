import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: req.userId },
    orderBy: { weekStart: 'desc' },
    take: 20,
    select: { weekStart: true, score: true, completedAt: true },
  });
  res.json(attempts);
});

router.post('/', async (req: AuthRequest, res) => {
  const { weekStart, score, answers } = req.body as { weekStart: string; score: number; answers: unknown };
  const attempt = await prisma.quizAttempt.upsert({
    where: { userId_weekStart: { userId: req.userId!, weekStart: new Date(weekStart) } },
    update: { score, answers: answers as any, completedAt: new Date() },
    create: { userId: req.userId!, weekStart: new Date(weekStart), score, answers: answers as any },
  });
  res.status(201).json(attempt);
});

export default router;
