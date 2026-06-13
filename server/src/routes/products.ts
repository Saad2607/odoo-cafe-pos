import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { ProductCategory } from '../models/ProductCategory.js';

const router = Router();

function mapProduct(p: {
  _id: unknown;
  name: string;
  price: number;
  unitOfMeasure: string;
  tax: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
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
    isActive: p.isActive,
    category: p.categoryId && typeof p.categoryId === 'object'
      ? {
          id: String((p.categoryId as { _id: unknown })._id),
          name: (p.categoryId as { name: string }).name,
          color: (p.categoryId as { color: string }).color,
        }
      : null,
  };
}

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  tax: z.number().min(0).default(0),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
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

router.get('/all', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'name color')
      .sort({ name: 1 });
    return res.json({ products: products.map(mapProduct) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/', authenticate, async (_req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('categoryId', 'name color')
      .sort({ name: 1 });
    return res.json({ products: products.map(mapProduct) });
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
