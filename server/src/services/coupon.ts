import { Coupon } from '../models/Coupon.js';

export function calculateDiscount(
  subtotal: number,
  taxAmount: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number,
): number {
  const base = subtotal + taxAmount;
  if (discountType === 'PERCENTAGE') {
    return Math.min(base, base * (discountValue / 100));
  }
  return Math.min(base, discountValue);
}

export async function validateCoupon(code: string) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new Error('Invalid or expired coupon code');
  return coupon;
}
