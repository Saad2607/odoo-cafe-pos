import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { formatOrder } from '../services/order.js';

const router = Router();

const statusSchema = z.object({
  kitchenStatus: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED']),
});

router.get('/', authenticate, async (_req, res) => {
  try {
    const orders = await Order.find({
      kitchenStatus: { $in: ['PENDING', 'PREPARING', 'READY'] },
      status: { $ne: 'CANCELLED' },
    })
      .populate('tableId', 'tableNumber')
      .sort({ date: 1 });

    return res.json({
      orders: orders.map((o) => formatOrder(o)),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch kitchen queue' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const data = statusSchema.parse(req.body);
    const order = await Order.findById(req.params.id).populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.kitchenStatus = data.kitchenStatus;
    await order.save();

    return res.json({
      message: 'Kitchen status updated',
      order: formatOrder(order),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update kitchen status' });
  }
});

export default router;
