import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { Floor } from '../models/Floor.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Order } from '../models/Order.js';

const router = Router();

const floorSchema = z.object({ name: z.string().min(1) });

const tableSchema = z.object({
  tableNumber: z.number().int().positive(),
  seats: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

async function buildFloorList() {
  const floors = await Floor.find().sort({ name: 1 });
  const activeOrders = await Order.find({ status: 'DRAFT' }).select('tableId');
  const occupiedTableIds = new Set(
    activeOrders.filter((o) => o.tableId).map((o) => String(o.tableId)),
  );

  return Promise.all(
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
          isActive: t.isActive,
          status: occupiedTableIds.has(String(t._id)) ? 'OCCUPIED' : 'FREE',
        })),
      };
    }),
  );
}

async function buildAdminFloorList() {
  const floors = await Floor.find().sort({ name: 1 });
  return Promise.all(
    floors.map(async (floor) => {
      const tables = await RestaurantTable.find({ floorId: floor._id })
        .sort({ tableNumber: 1 });
      return {
        id: String(floor._id),
        name: floor.name,
        tables: tables.map((t) => ({
          id: String(t._id),
          tableNumber: t.tableNumber,
          seats: t.seats,
          isActive: t.isActive,
        })),
      };
    }),
  );
}

router.get('/', authenticate, async (_req, res) => {
  try {
    const floors = await buildFloorList();
    return res.json({ floors });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch floor plan' });
  }
});

router.get('/manage', authenticate, requireRole('ADMIN'), async (_req, res) => {
  try {
    const floors = await buildAdminFloorList();
    return res.json({ floors });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = floorSchema.parse(req.body);
    const floor = await Floor.create({ name: data.name });
    return res.status(201).json({
      floor: { id: String(floor._id), name: floor.name, tables: [] },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to create floor' });
  }
});

router.patch('/:floorId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = floorSchema.parse(req.body);
    const floor = await Floor.findByIdAndUpdate(req.params.floorId, data, { new: true });
    if (!floor) return res.status(404).json({ error: 'Floor not found' });
    return res.json({ floor: { id: String(floor._id), name: floor.name } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update floor' });
  }
});

router.delete('/:floorId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.floorId);
    if (!floor) return res.status(404).json({ error: 'Floor not found' });

    const tableCount = await RestaurantTable.countDocuments({ floorId: floor._id });
    if (tableCount > 0) {
      return res.status(400).json({ error: 'Remove all tables before deleting this floor' });
    }

    await floor.deleteOne();
    return res.json({ message: 'Floor deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete floor' });
  }
});

router.post('/:floorId/tables', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = tableSchema.parse(req.body);
    const floor = await Floor.findById(req.params.floorId);
    if (!floor) return res.status(404).json({ error: 'Floor not found' });

    const existing = await RestaurantTable.findOne({
      floorId: floor._id,
      tableNumber: data.tableNumber,
    });
    if (existing) {
      return res.status(400).json({ error: `Table ${data.tableNumber} already exists on this floor` });
    }

    const table = await RestaurantTable.create({
      floorId: floor._id,
      tableNumber: data.tableNumber,
      seats: data.seats,
      isActive: data.isActive ?? true,
    });

    return res.status(201).json({
      table: {
        id: String(table._id),
        tableNumber: table.tableNumber,
        seats: table.seats,
        isActive: table.isActive,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to add table' });
  }
});

router.patch('/tables/:tableId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const data = tableSchema.partial().parse(req.body);
    const table = await RestaurantTable.findByIdAndUpdate(req.params.tableId, data, { new: true });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    return res.json({
      table: {
        id: String(table._id),
        tableNumber: table.tableNumber,
        seats: table.seats,
        isActive: table.isActive,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to update table' });
  }
});

router.delete('/tables/:tableId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const table = await RestaurantTable.findById(req.params.tableId);
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const openOrder = await Order.findOne({ tableId: table._id, status: 'DRAFT' });
    if (openOrder) {
      return res.status(400).json({ error: 'Cannot remove table with an active order' });
    }

    await table.deleteOne();
    return res.json({ message: 'Table removed' });
  } catch {
    return res.status(500).json({ error: 'Failed to remove table' });
  }
});

export default router;
