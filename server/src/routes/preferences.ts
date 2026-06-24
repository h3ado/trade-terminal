import { Router } from 'express';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(verifyJwt);

router.get('/', async (req: AuthRequest, res) => {
  const prefs = await prisma.userPreference.findMany({ where: { userId: req.userId } });
  // Return as key→value map for easy consumption
  const map: Record<string, unknown> = {};
  for (const p of prefs) map[p.key] = p.value;
  res.json(map);
});

router.put('/:key', async (req: AuthRequest, res) => {
  const pref = await prisma.userPreference.upsert({
    where: { userId_key: { userId: req.userId!, key: req.params.key } },
    update: { value: req.body.value },
    create: { userId: req.userId!, key: req.params.key, value: req.body.value },
  });
  res.json(pref);
});

router.delete('/:key', async (req: AuthRequest, res) => {
  await prisma.userPreference.deleteMany({ where: { userId: req.userId, key: req.params.key } });
  res.status(204).end();
});

export default router;
