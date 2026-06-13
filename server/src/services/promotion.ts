import { Promotion } from '../models/Promotion.js';
import { calculateDiscount } from './coupon.js';

interface LineItem {
  productId: unknown;
  quantity: number;
  lineTotal: number;
}

export async function applyPromotions(subtotal: number, taxAmount: number, items: LineItem[]) {
  const promotions = await Promotion.find({ isActive: true });
  let bestDiscount = 0;
  let promotionName: string | undefined;

  for (const promo of promotions) {
    let eligible = false;

    if (promo.triggerType === 'ORDER' && promo.minOrderAmount != null) {
      eligible = subtotal >= promo.minOrderAmount;
    }

    if (promo.triggerType === 'PRODUCT' && promo.productId && promo.minQuantity) {
      const line = items.find((i) => String(i.productId) === String(promo.productId));
      eligible = !!line && line.quantity >= promo.minQuantity;
    }

    if (!eligible) continue;

    const discount = calculateDiscount(
      subtotal,
      taxAmount,
      promo.discountType,
      promo.discountValue,
    );

    if (discount > bestDiscount) {
      bestDiscount = discount;
      promotionName = promo.name;
    }
  }

  return { discount: bestDiscount, promotionName };
}
