import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ProductCategory } from '../models/ProductCategory.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

router.get('/', authenticate, async (_req, res) => {
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

router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await ProductCategory.create(data);
    return res.status(201).json({
      category: { id: String(category._id), name: category.name, color: category.color },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await ProductCategory.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json({
      category: { id: String(category._id), name: category.name, color: category.color },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const category = await ProductCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json({ message: 'Category deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
