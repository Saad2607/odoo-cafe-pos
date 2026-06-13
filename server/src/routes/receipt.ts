import { Router } from 'express';
import { getReceiptByToken } from '../services/receipt.js';

const router = Router();

router.get('/:token', async (req, res) => {
  try {
    const order = await getReceiptByToken(req.params.token);
    if (!order) return res.status(404).json({ error: 'Receipt not found' });
    return res.json({ order });
  } catch {
    return res.status(500).json({ error: 'Failed to load receipt' });
  }
});

export default router;
