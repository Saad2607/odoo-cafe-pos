import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { formatOrder } from '../services/order.js';

const router = Router();

const statusSchema = z.object({
  kitchenStatus: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED']),
});

router.get('/', authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const filter: Record<string, unknown> = {
      kitchenStatus: { $in: ['PENDING', 'PREPARING', 'READY'] },
      status: { $ne: 'CANCELLED' },
    };
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'items.productName': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('tableId', 'tableNumber')
      .sort({ date: 1 });

    return res.json({ orders: orders.map((o) => formatOrder(o)) });
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

router.patch('/:orderId/items/:itemId/done', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const itemId = String(req.params.itemId);
    const item = order.items.find((i) => String((i as { _id?: unknown })._id) === itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.kitchenDone = !item.kitchenDone;
    await order.save();

    return res.json({ order: formatOrder(order) });
  } catch {
    return res.status(500).json({ error: 'Failed to update item' });
  }
});

export default router;
