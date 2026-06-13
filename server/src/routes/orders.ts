import { Router } from 'express';

import { z } from 'zod';

import { authenticate, AuthRequest } from '../middleware/auth.js';

import { Order } from '../models/Order.js';

import { getPaymentSettings } from '../models/PaymentSettings.js';

import { createOrder, formatOrder } from '../services/order.js';

import { calculateDiscount, validateCoupon } from '../services/coupon.js';

import { applyPromotions } from '../services/promotion.js';



const router = Router();



const createOrderSchema = z.object({

  tableId: z.string().min(1, 'Table is required'),

  customerId: z.string().optional(),

  items: z.array(z.object({

    productId: z.string().min(1),

    quantity: z.number().int().min(1),

  })).min(1, 'Add at least one product'),

});



const paySchema = z.object({

  couponCode: z.string().optional(),

  paymentMethod: z.enum(['CASH', 'CARD', 'UPI']),

  amountReceived: z.number().optional(),

  cardReference: z.string().optional(),

});



const customerSchema = z.object({

  customerId: z.string().nullable(),

});



router.get('/session', authenticate, async (req: AuthRequest, res) => {

  try {

    const q = (req.query.q as string | undefined)?.trim();

    const filter: Record<string, unknown> = { sessionId: req.user!.sessionId };

    if (q) {

      filter.$or = [

        { orderNumber: { $regex: q, $options: 'i' } },

        { 'items.productName': { $regex: q, $options: 'i' } },

      ];

    }

    const orders = await Order.find(filter)

      .populate('tableId', 'tableNumber')

      .populate('customerId', 'name email phone')

      .sort({ createdAt: -1 });

    return res.json({ orders: orders.map(formatOrder) });

  } catch {

    return res.status(500).json({ error: 'Failed to fetch session orders' });

  }

});



router.get('/table/:tableId', authenticate, async (req, res) => {

  try {

    const order = await Order.findOne({ tableId: req.params.tableId, status: 'DRAFT' })

      .populate('tableId', 'tableNumber')

      .populate('customerId', 'name email phone');



    if (!order) return res.json({ order: null });

    return res.json({ order: formatOrder(order) });

  } catch {

    return res.status(500).json({ error: 'Failed to fetch table order' });

  }

});



router.get('/:id', authenticate, async (req, res) => {

  try {

    const order = await Order.findById(req.params.id)

      .populate('tableId', 'tableNumber')

      .populate('customerId', 'name email phone');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    return res.json({ order: formatOrder(order) });

  } catch {

    return res.status(500).json({ error: 'Failed to fetch order' });

  }

});



router.post('/', authenticate, async (req: AuthRequest, res) => {

  try {

    const data = createOrderSchema.parse(req.body);

    const order = await createOrder({

      tableId: data.tableId,

      sessionId: req.user!.sessionId,

      employeeId: req.user!.userId,

      customerId: data.customerId,

      items: data.items,

    });



    await order.populate('tableId', 'tableNumber');

    await order.populate('customerId', 'name email phone');

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



router.patch('/:id/customer', authenticate, async (req, res) => {

  try {

    const data = customerSchema.parse(req.body);

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'DRAFT') {

      return res.status(400).json({ error: 'Only draft orders can be updated' });

    }

    order.customerId = data.customerId ? data.customerId as never : undefined;

    await order.save();

    await order.populate('tableId', 'tableNumber');

    await order.populate('customerId', 'name email phone');

    return res.json({ order: formatOrder(order) });

  } catch (err) {

    if (err instanceof z.ZodError) {

      return res.status(400).json({ error: err.errors[0].message });

    }

    return res.status(500).json({ error: 'Failed to assign customer' });

  }

});



router.delete('/:id', authenticate, async (req, res) => {

  try {

    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'DRAFT') {

      return res.status(400).json({ error: 'Only draft orders can be cancelled' });

    }

    order.status = 'CANCELLED';

    order.kitchenStatus = 'NONE';

    await order.save();

    return res.json({ message: 'Order cancelled' });

  } catch {

    return res.status(500).json({ error: 'Failed to cancel order' });

  }

});



router.patch('/:id/pay', authenticate, async (req, res) => {

  try {

    const body = paySchema.parse(req.body);

    const settings = await getPaymentSettings();



    if (body.paymentMethod === 'CASH' && !settings.cashEnabled) {

      return res.status(400).json({ error: 'Cash payments are disabled' });

    }

    if (body.paymentMethod === 'CARD' && !settings.cardEnabled) {

      return res.status(400).json({ error: 'Card payments are disabled' });

    }

    if (body.paymentMethod === 'UPI' && !settings.upiEnabled) {

      return res.status(400).json({ error: 'UPI payments are disabled' });

    }



    const order = await Order.findById(req.params.id)

      .populate('tableId', 'tableNumber')

      .populate('customerId', 'name email phone');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'DRAFT') {

      return res.status(400).json({ error: 'Only draft orders can be paid' });

    }



    let discount = order.discount;

    let promotionName = order.promotionName;



    const promo = await applyPromotions(order.subtotal, order.taxAmount, order.items);

    if (promo.discount > discount) {

      discount = promo.discount;

      promotionName = promo.promotionName;

    }



    if (body.couponCode) {

      const coupon = await validateCoupon(body.couponCode);

      const couponDiscount = calculateDiscount(

        order.subtotal,

        order.taxAmount,

        coupon.discountType,

        coupon.discountValue,

      );

      if (couponDiscount > discount) {

        discount = couponDiscount;

        order.couponCode = coupon.code;

        promotionName = undefined;

      }

    }



    const amountDue = order.subtotal + order.taxAmount - discount;
    const cashMinimum = Math.round(amountDue);

    if (body.paymentMethod === 'CASH') {
      if (!body.amountReceived || body.amountReceived < cashMinimum) {
        return res.status(400).json({ error: `Amount received must be at least ₹${cashMinimum}` });
      }
      order.amountReceived = body.amountReceived;
      order.changeDue = body.amountReceived - amountDue;
    }



    if (body.paymentMethod === 'CARD') {

      if (!body.cardReference?.trim()) {

        return res.status(400).json({ error: 'Card reference is required' });

      }

      order.cardReference = body.cardReference.trim();

    }



    order.discount = discount;

    order.promotionName = promotionName;

    order.amount = amountDue;

    order.paymentMethod = body.paymentMethod;

    order.status = 'PAID';

    if (order.kitchenStatus === 'READY') order.kitchenStatus = 'SERVED';

    await order.save();



    const formatted = formatOrder(order);

    return res.json({
      message: 'Payment successful',
      order: formatted,
      receipt: formatted.customer?.email
        ? { emailed: true, to: formatted.customer.email }
        : { emailed: false },
    });

  } catch (err) {

    if (err instanceof z.ZodError) {

      return res.status(400).json({ error: err.errors[0].message });

    }

    if (err instanceof Error) {

      return res.status(400).json({ error: err.message });

    }

    return res.status(500).json({ error: 'Failed to process payment' });

  }

});



export default router;

