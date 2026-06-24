import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const rules = await prisma.optionAlertRule.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rules);
});

router.post('/', async (req: AuthRequest, res) => {
  const rule = await prisma.optionAlertRule.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(rule);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.optionAlertRule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const rule = await prisma.optionAlertRule.update({ where: { id: req.params.id }, data: req.body });
  res.json(rule);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.optionAlertRule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.optionAlertRule.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
