import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { createOrder, formatOrder } from '../services/order.js';

const router = Router();

const createOrderSchema = z.object({
  tableId: z.string().min(1, 'Table is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1, 'Add at least one product'),
});

router.get('/table/:tableId', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ tableId: req.params.tableId, status: 'DRAFT' })
      .populate('tableId', 'tableNumber');

    if (!order) return res.json({ order: null });
    return res.json({ order: formatOrder(order) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch table order' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const order = await createOrder({
      tableId: data.tableId,
      sessionId: req.user!.sessionId,
      employeeId: req.user!.userId,
      items: data.items,
    });

    await order.populate('tableId', 'tableNumber');
    return res.status(201).json({
      message: 'Order created and sent to kitchen',
      order: formatOrder(order),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

router.patch('/:id/pay', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('tableId', 'tableNumber');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft orders can be paid' });
    }

    order.status = 'PAID';
    if (order.kitchenStatus === 'READY') order.kitchenStatus = 'SERVED';
    await order.save();

    return res.json({
      message: 'Payment successful',
      order: formatOrder(order),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
