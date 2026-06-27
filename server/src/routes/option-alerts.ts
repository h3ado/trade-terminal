import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';
import { asyncRoute } from '../lib/http';

const router = Router();
router.use(verifyJwt);

router.get('/', asyncRoute<AuthRequest>(async (req, res) => {
  const rules = await prisma.optionAlertRule.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rules);
}));

router.post('/', asyncRoute<AuthRequest>(async (req, res) => {
  const rule = await prisma.optionAlertRule.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(rule);
}));

router.patch('/:id', asyncRoute<AuthRequest>(async (req, res) => {
  const existing = await prisma.optionAlertRule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const rule = await prisma.optionAlertRule.update({ where: { id: req.params.id }, data: req.body });
  res.json(rule);
}));

router.delete('/:id', asyncRoute<AuthRequest>(async (req, res) => {
  const existing = await prisma.optionAlertRule.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.optionAlertRule.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

export default router;
