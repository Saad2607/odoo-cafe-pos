import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { ProductCategory } from '../models/ProductCategory.js';

function mapProduct(p: {
  _id: unknown;
  name: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description?: string;
  imageUrl?: string;
  sendToKitchen?: boolean;
  isActive: boolean;
  tags?: string[];
  isBestseller?: boolean;
  isNewArrival?: boolean;
  spiceLevel?: number;
  categoryId: { _id?: unknown; name?: string; color?: string } | unknown;
}) {
  return {
    id: String(p._id),
    name: p.name,
    price: p.price,
    unitOfMeasure: p.unitOfMeasure,
    tax: p.tax,
    description: p.description ?? '',
    imageUrl: p.imageUrl ?? null,
    sendToKitchen: p.sendToKitchen ?? true,
    isActive: p.isActive,
    tags: p.tags ?? [],
    isBestseller: p.isBestseller ?? false,
    isNewArrival: p.isNewArrival ?? false,
    spiceLevel: p.spiceLevel ?? 0,
    category: p.categoryId && typeof p.categoryId === 'object'
      ? {
          id: String((p.categoryId as { _id: unknown })._id),
          name: (p.categoryId as { name: string }).name,
          color: (p.categoryId as { color: string }).color,
        }
      : null,
  };
}

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  tax: z.number().min(0).default(0),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sendToKitchen: z.boolean().optional(),
});

router.get('/stats', authenticate, async (_req, res) => {
  try {
    const [total, categories, bestsellers, newItems, vegItems] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      ProductCategory.countDocuments(),
      Product.countDocuments({ isActive: true, isBestseller: true }),
      Product.countDocuments({ isActive: true, isNewArrival: true }),
      Product.countDocuments({ isActive: true, tags: 'VEG' }),
    ]);
    const cats = await ProductCategory.find().sort({ name: 1 });
    const perCategory = await Promise.all(cats.map(async (c) => ({
      id: String(c._id),
      name: c.name,
      color: c.color,
      count: await Product.countDocuments({ categoryId: c._id, isActive: true }),
    })));
    return res.json({
      totalProducts: total,
      totalCategories: categories,
      bestsellers,
      newItems,
      vegItems,
      categories: perCategory,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

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

router.get('/all', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(20, Number(req.query.limit) || 50));
    const filter: Record<string, unknown> = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.q) filter.name = { $regex: String(req.query.q), $options: 'i' };

    const [products, total] = await Promise.all([
      Product.find(filter).populate('categoryId', 'name color').sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);
    return res.json({ products: products.map(mapProduct), total, page, limit });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.tag) filter.tags = String(req.query.tag).toUpperCase();
    if (req.query.bestseller === 'true') filter.isBestseller = true;
    if (req.query.new === 'true') filter.isNewArrival = true;
    if (req.query.q) filter.name = { $regex: String(req.query.q), $options: 'i' };

    const query = Product.find(filter)
      .populate('categoryId', 'name color')
      .sort({ isBestseller: -1, name: 1 });
    if (req.query.limit) query.limit(Number(req.query.limit));
    const result = await query;
    return res.json({ products: result.map(mapProduct) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const category = await ProductCategory.findById(data.categoryId);
    if (!category) return res.status(400).json({ error: 'Category not found' });

    const product = await Product.create(data);
    await product.populate('categoryId', 'name color');
    return res.status(201).json({ product: mapProduct(product) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
      .populate('categoryId', 'name color');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product: mapProduct(product) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ message: 'Product deactivated' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
