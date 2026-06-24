import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const trades = await prisma.trade.findMany({
    where: { userId: req.userId },
    orderBy: { entryDate: 'desc' },
  });
  res.json(trades);
});

router.post('/', async (req: AuthRequest, res) => {
  const trade = await prisma.trade.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(trade);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.trade.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Trade not found' }); return; }
  const trade = await prisma.trade.update({ where: { id: req.params.id }, data: req.body });
  res.json(trade);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.trade.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Trade not found' }); return; }
  await prisma.trade.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
