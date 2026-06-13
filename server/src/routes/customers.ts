import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { Customer } from '../models/Customer.js';

const router = Router();

function mapCustomer(c: { _id: unknown; name: string; email?: string; phone?: string }) {
  return {
    id: String(c._id),
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
  };
}

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

router.get('/', authenticate, async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const customers = await Customer.find(filter).sort({ name: 1 }).limit(50);
    return res.json({ customers: customers.map(mapCustomer) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await Customer.create({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
    });
    return res.status(201).json({ customer: mapCustomer(customer) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = customerSchema.partial().parse(req.body);
    const customer = await Customer.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    return res.json({ customer: mapCustomer(customer) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    return res.json({ message: 'Customer deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
