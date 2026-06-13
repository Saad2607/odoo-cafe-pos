import { Promotion } from '../models/Promotion.js';
import { calculateDiscount } from './coupon.js';

export interface PromoLineItem {
  productId: unknown;
  quantity: number;
  lineTotal: number;
  discount?: number;
}

export async function applyPromotions(subtotal: number, taxAmount: number, items: PromoLineItem[]) {
  const promotions = await Promotion.find({ isActive: true });
  let bestDiscount = 0;
  let promotionName: string | undefined;
  let productLineIndex: number | null = null;

  for (const promo of promotions) {
    let eligible = false;
    let lineIndex: number | null = null;

    if (promo.triggerType === 'ORDER' && promo.minOrderAmount != null) {
      eligible = subtotal >= promo.minOrderAmount;
    }

    if (promo.triggerType === 'PRODUCT' && promo.productId && promo.minQuantity) {
      lineIndex = items.findIndex((i) => String(i.productId) === String(promo.productId));
      eligible = lineIndex >= 0 && items[lineIndex].quantity >= promo.minQuantity;
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
      productLineIndex = promo.triggerType === 'PRODUCT' ? lineIndex : null;
    }
  }

  for (const item of items) {
    item.discount = 0;
  }
  if (bestDiscount > 0 && productLineIndex != null && productLineIndex >= 0) {
    items[productLineIndex].discount = bestDiscount;
  }

  return { discount: bestDiscount, promotionName };
}
