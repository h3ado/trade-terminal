import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';
import { asyncRoute } from '../lib/http';

const router = Router();
router.use(verifyJwt);

router.get('/', asyncRoute<AuthRequest>(async (req, res) => {
  const templates = await prisma.optionStrategyTemplate.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(templates);
}));

router.post('/', asyncRoute<AuthRequest>(async (req, res) => {
  const template = await prisma.optionStrategyTemplate.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(template);
}));

router.delete('/:id', asyncRoute<AuthRequest>(async (req, res) => {
  const existing = await prisma.optionStrategyTemplate.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.optionStrategyTemplate.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

export default router;
