// E in MERN — Auth routes: signup, login, me

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { PosSession } from '../models/PosSession.js';
import { signToken } from '../lib/jwt.js';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { openPosSession, getActiveSession } from '../services/session.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

function formatSession(session: {
  _id: unknown; sessionNumber: string; openedAt: Date;
  status: string; lastClosingSale?: number | null;
}) {
  return {
    id: String(session._id),
    sessionNumber: session.sessionNumber,
    openedAt: session.openedAt,
    status: session.status,
    lastClosingSale: session.lastClosingSale ?? null,
  };
}

router.post('/signup', async (req, res) => {
  let createdUserId: string | null = null;

  try {
    const data = signupSchema.parse(req.body);
    if (await User.findOne({ email: data.email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name: data.name, email: data.email,
      password: await bcrypt.hash(data.password, 10), role: 'ADMIN',
    });
    createdUserId = String(user._id);

    const session = await openPosSession(createdUserId);
    const token = signToken({
      userId: createdUserId, email: user.email,
      role: user.role, sessionId: String(session._id),
    });

    return res.status(201).json({
      message: 'Account created successfully', token,
      user: { id: createdUserId, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      session: formatSession(session),
    });
  } catch (err) {
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch(() => undefined);
    }
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid email or password' });
    if (!(await bcrypt.compare(data.password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let session = await getActiveSession(String(user._id));
    if (!session) session = await openPosSession(String(user._id));

    const token = signToken({
      userId: String(user._id), email: user.email,
      role: user.role, sessionId: String(session._id),
    });

    return res.json({
      message: 'Login successful', token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      session: formatSession(session),
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or inactive' });
    const session = await PosSession.findById(req.user!.sessionId);
    return res.json({
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, isActive: user.isActive },
      session: session ? formatSession(session) : null,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/auth/admin-panel — ADMIN only
router.get('/admin-panel', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  return res.json({
    message: 'Welcome to the admin panel',
    role: req.user!.role,
    access: 'ADMIN only',
  });
});

// GET /api/auth/employee-panel — EMPLOYEE only
router.get('/employee-panel', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  return res.json({
    message: 'Welcome to the cashier panel',
    role: req.user!.role,
    access: 'EMPLOYEE only',
  });
});

export default router;