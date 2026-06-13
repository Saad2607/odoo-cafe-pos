import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Coupon } from '../models/Coupon.js';
import { Promotion } from '../models/Promotion.js';

const router = Router();

const couponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  isActive: z.boolean().optional(),
});

const promotionSchema = z.object({
  name: z.string().min(1),
  triggerType: z.enum(['PRODUCT', 'ORDER']),
  minQuantity: z.number().optional(),
  minOrderAmount: z.number().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  productId: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/coupons', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ code: 1 });
    return res.json({
      coupons: coupons.map((c) => ({
        id: String(c._id),
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        isActive: c.isActive,
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = couponSchema.parse(req.body);
    const coupon = await Coupon.create(data);
    return res.status(201).json({
      coupon: { id: String(coupon._id), code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, isActive: coupon.isActive },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.patch('/coupons/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = couponSchema.partial().parse(req.body);
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    return res.json({
      coupon: { id: String(coupon._id), code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, isActive: coupon.isActive },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    return res.json({ message: 'Coupon deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

router.get('/promotions', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const promotions = await Promotion.find().populate('productId', 'name').sort({ name: 1 });
    return res.json({
      promotions: promotions.map((p) => ({
        id: String(p._id),
        name: p.name,
        triggerType: p.triggerType,
        minQuantity: p.minQuantity ?? null,
        minOrderAmount: p.minOrderAmount ?? null,
        discountType: p.discountType,
        discountValue: p.discountValue,
        productId: p.productId ? String((p.productId as { _id: unknown })._id) : null,
        productName: p.productId && typeof p.productId === 'object' ? (p.productId as { name?: string }).name : null,
        isActive: p.isActive,
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

router.post('/promotions', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = promotionSchema.parse(req.body);
    const promotion = await Promotion.create(data);
    return res.status(201).json({ promotion: { id: String(promotion._id), name: promotion.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to create promotion' });
  }
});

router.patch('/promotions/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = promotionSchema.partial().parse(req.body);
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!promotion) return res.status(404).json({ error: 'Promotion not found' });
    return res.json({ promotion: { id: String(promotion._id), name: promotion.name } });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to update promotion' });
  }
});

router.delete('/promotions/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ error: 'Promotion not found' });
    return res.json({ message: 'Promotion deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

export default router;
