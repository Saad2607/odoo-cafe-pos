import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Floor } from '../models/Floor.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Order } from '../models/Order.js';
import { PosSession } from '../models/PosSession.js';
import { orderGrandTotal } from '../utils/orderTotals.js';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const session = await PosSession.findById(req.user!.sessionId);
    const sessionId = req.user!.sessionId;

    const floors = await Floor.find().sort({ name: 1 });
    const draftOrders = await Order.find({ sessionId, status: 'DRAFT' }).select('tableId amount');
    const occupiedIds = new Set(draftOrders.filter((o) => o.tableId).map((o) => String(o.tableId)));

    const floorData = await Promise.all(
      floors.map(async (floor) => {
        const tables = await RestaurantTable.find({ floorId: floor._id, isActive: true }).sort({ tableNumber: 1 });
        return {
          id: String(floor._id),
          name: floor.name,
          tables: tables.map((t) => ({
            id: String(t._id),
            tableNumber: t.tableNumber,
            seats: t.seats,
            status: occupiedIds.has(String(t._id)) ? 'OCCUPIED' : 'FREE',
          })),
        };
      }),
    );

    const kitchenOrders = await Order.find({
      sessionId,
      kitchenStatus: { $in: ['PENDING', 'PREPARING', 'READY'] },
      status: { $ne: 'CANCELLED' },
    }).populate('tableId', 'tableNumber').sort({ date: -1 }).limit(8);

    const paidOrders = await Order.find({ sessionId, status: 'PAID' });
    const totalSales = paidOrders.reduce((s, o) => s + orderGrandTotal(o), 0);

    const recentPaid = await Order.find({ sessionId, status: 'PAID' })
      .sort({ date: -1 })
      .limit(6)
      .select('orderNumber amount date paymentMethod');

    const activeTables = occupiedIds.size;
    const totalTables = floorData.reduce((s, f) => s + f.tables.length, 0);

    return res.json({
      session: {
        sessionNumber: session?.sessionNumber ?? '',
        openedAt: session?.openedAt,
        lastClosingSale: session?.lastClosingSale ?? 0,
      },
      stats: {
        totalSales: Math.round(totalSales),
        paidCount: paidOrders.length,
        kitchenCount: kitchenOrders.length,
        activeTables,
        totalTables,
        draftCount: draftOrders.length,
      },
      floors: floorData,
      kitchenQueue: kitchenOrders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        kitchenStatus: o.kitchenStatus,
        tableNumber: (o.tableId as { tableNumber?: number })?.tableNumber ?? null,
        itemCount: o.items.length,
        amount: o.amount,
      })),
      recentSales: recentPaid.map((o) => ({
        orderNumber: o.orderNumber,
        amount: orderGrandTotal(o),
        date: o.date,
        paymentMethod: o.paymentMethod,
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch live data' });
  }
});

export default router;
