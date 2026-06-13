import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { ProductCategory } from '../models/ProductCategory.js';

const router = Router();

router.get('/categories', authenticate, async (_req, res) => {
  try {
    const categories = await ProductCategory.find().sort({ name: 1 });
    return res.json({
      categories: categories.map((c) => ({
        id: String(c._id),
        name: c.name,
        color: c.color,
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/', authenticate, async (_req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name color')
      .sort({ name: 1 });

    return res.json({
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        price: p.price,
        unitOfMeasure: p.unitOfMeasure,
        tax: p.tax,
        description: p.description ?? '',
        category: p.categoryId && typeof p.categoryId === 'object'
          ? {
              id: String((p.categoryId as { _id: unknown })._id),
              name: (p.categoryId as { name: string }).name,
              color: (p.categoryId as { color: string }).color,
            }
          : null,
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;
