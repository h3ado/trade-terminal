import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(accounts);
});

router.post('/', async (req: AuthRequest, res) => {
  const account = await prisma.tradingAccount.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(account);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.tradingAccount.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Account not found' }); return; }
  const account = await prisma.tradingAccount.update({ where: { id: req.params.id }, data: req.body });
  res.json(account);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.tradingAccount.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Account not found' }); return; }
  await prisma.tradingAccount.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
