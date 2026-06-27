import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';
import { asyncRoute } from '../lib/http';

const router = Router();
router.use(verifyJwt);

router.get('/', asyncRoute<AuthRequest>(async (req, res) => {
  const searches = await prisma.newsSavedSearch.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(searches);
}));

router.post('/', asyncRoute<AuthRequest>(async (req, res) => {
  const search = await prisma.newsSavedSearch.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json(search);
}));

router.patch('/:id', asyncRoute<AuthRequest>(async (req, res) => {
  const existing = await prisma.newsSavedSearch.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const search = await prisma.newsSavedSearch.update({ where: { id: req.params.id }, data: req.body });
  res.json(search);
}));

router.delete('/:id', asyncRoute<AuthRequest>(async (req, res) => {
  const existing = await prisma.newsSavedSearch.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.newsSavedSearch.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

export default router;
