import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { ComboMeal } from '../models/ComboMeal.js';
import { Product } from '../models/Product.js';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const combos = await ComboMeal.find({ isActive: true }).sort({ name: 1 });
    const result = await Promise.all(combos.map(async (combo) => {
      const items = await Promise.all(combo.items.map(async (item) => {
        const p = await Product.findById(item.productId).populate('categoryId', 'name color');
        if (!p) return null;
        const cat = p.categoryId as { name?: string; color?: string } | null;
        return {
          productId: String(p._id),
          productName: p.name,
          quantity: item.quantity,
          price: p.price,
          category: cat?.name
            ? { name: cat.name, color: cat.color ?? '#9E4B3A' }
            : null,
        };
      }));
      const validItems = items.filter(Boolean);
      const originalTotal = validItems.reduce((s, i) => s + (i!.price * i!.quantity), 0);
      return {
        id: String(combo._id),
        name: combo.name,
        tagline: combo.tagline,
        description: combo.description,
        price: combo.price,
        discountPercent: combo.discountPercent,
        originalTotal,
        savings: Math.max(0, originalTotal - combo.price),
        items: validItems,
      };
    }));
    return res.json({ combos: result });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch combos' });
  }
});

export default router;
