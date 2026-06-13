import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { calculateDiscount, validateCoupon } from '../services/coupon.js';

const router = Router();

const validateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
});

router.post('/validate', authenticate, async (req, res) => {
  try {
    const data = validateSchema.parse(req.body);
    const coupon = await validateCoupon(data.code);
    const discount = calculateDiscount(
      data.subtotal,
      data.taxAmount,
      coupon.discountType,
      coupon.discountValue,
    );

    return res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      total: data.subtotal + data.taxAmount - discount,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
