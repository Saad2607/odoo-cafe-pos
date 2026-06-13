import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getPaymentSettings } from '../models/PaymentSettings.js';

const router = Router();

function mapSettings(s: {
  cashEnabled: boolean;
  cardEnabled: boolean;
  upiEnabled: boolean;
  upiId: string;
}) {
  return {
    cashEnabled: s.cashEnabled,
    cardEnabled: s.cardEnabled,
    upiEnabled: s.upiEnabled,
    upiId: s.upiId,
  };
}

router.get('/', authenticate, async (_req, res) => {
  try {
    const settings = await getPaymentSettings();
    return res.json({ settings: mapSettings(settings) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

const updateSchema = z.object({
  cashEnabled: z.boolean().optional(),
  cardEnabled: z.boolean().optional(),
  upiEnabled: z.boolean().optional(),
  upiId: z.string().optional(),
});

router.patch('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const settings = await getPaymentSettings();
    Object.assign(settings, data);
    await settings.save();
    return res.json({ settings: mapSettings(settings) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

export default router;
