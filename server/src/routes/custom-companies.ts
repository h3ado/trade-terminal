import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const companies = await prisma.customCompany.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(companies);
});

router.post('/', async (req: AuthRequest, res) => {
  const company = await prisma.customCompany.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(company);
});

router.patch('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.customCompany.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const company = await prisma.customCompany.update({ where: { id: req.params.id }, data: req.body });
  res.json(company);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.customCompany.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.customCompany.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
