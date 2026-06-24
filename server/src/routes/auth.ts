import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyJwt, AuthRequest } from '../middleware/auth';

const router = Router();

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body as Record<string, string>;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hash, displayName: displayName ?? email.split('@')[0] },
    select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  res.status(201).json({ token: signToken(user.id), user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as Record<string, string>;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const { password: _pw, ...safe } = user;
  res.json({ token: signToken(user.id), user: safe });
});

router.get('/me', verifyJwt, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

router.post('/logout', (_req, res) => {
  // JWT is stateless — client drops the token
  res.json({ ok: true });
});

export default router;
