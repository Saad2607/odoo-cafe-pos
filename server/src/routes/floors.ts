import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Floor } from '../models/Floor.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Order } from '../models/Order.js';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const floors = await Floor.find().sort({ name: 1 });
    const activeOrders = await Order.find({ status: 'DRAFT' }).select('tableId');
    const occupiedTableIds = new Set(
      activeOrders.filter((o) => o.tableId).map((o) => String(o.tableId)),
    );

    const result = await Promise.all(
      floors.map(async (floor) => {
        const tables = await RestaurantTable.find({ floorId: floor._id, isActive: true })
          .sort({ tableNumber: 1 });

        return {
          id: String(floor._id),
          name: floor.name,
          tables: tables.map((t) => ({
            id: String(t._id),
            tableNumber: t.tableNumber,
            seats: t.seats,
            status: occupiedTableIds.has(String(t._id)) ? 'OCCUPIED' : 'FREE',
          })),
        };
      }),
    );

    return res.json({ floors: result });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch floor plan' });
  }
});

export default router;
