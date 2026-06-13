// E in MERN — Session routes: current, open

import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { PosSession } from '../models/PosSession.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { openPosSession } from '../services/session.js';

const router = Router();

router.get('/current', authenticate, async (req: AuthRequest, res) => {
  try {
    const session = await PosSession.findById(req.user!.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const user = await User.findById(session.userId).select('name email role');
    const orderCount = await Order.countDocuments({ sessionId: session._id });

    return res.json({
      session: {
        id: String(session._id), sessionNumber: session.sessionNumber,
        openedAt: session.openedAt, status: session.status,
        lastClosingSale: session.lastClosingSale, orderCount,
        user: user ? { id: String(user._id), name: user.name, email: user.email, role: user.role } : null,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.post('/open', authenticate, async (req: AuthRequest, res) => {
  try {
    const existing = await PosSession.findOne({ userId: req.user!.userId, status: 'OPEN' });
    if (existing) {
      return res.json({ message: 'Active session already open', session: { id: String(existing._id) } });
    }
    const session = await openPosSession(req.user!.userId);
    return res.status(201).json({ session: { id: String(session._id), sessionNumber: session.sessionNumber } });
  } catch {
    return res.status(500).json({ error: 'Failed to open session' });
  }
});

export default router;