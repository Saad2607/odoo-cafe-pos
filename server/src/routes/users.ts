import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

function mapUser(u: { _id: unknown; name: string; email: string; role: string; isActive: boolean }) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
  };
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
});

const passwordSchema = z.object({
  password: z.string().min(6),
});

router.get('/', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    return res.json({ users: users.map(mapUser) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    if (await User.findOne({ email: data.email })) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({
      ...data,
      password: await bcrypt.hash(data.password, 10),
    });
    return res.status(201).json({ user: mapUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id/password', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = passwordSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: await bcrypt.hash(data.password, 10) },
      { new: true },
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: mapUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

router.patch('/:id/archive', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: mapUser(user) });
  } catch {
    return res.status(500).json({ error: 'Failed to archive user' });
  }
});

router.patch('/:id/restore', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: mapUser(user) });
  } catch {
    return res.status(500).json({ error: 'Failed to restore user' });
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
