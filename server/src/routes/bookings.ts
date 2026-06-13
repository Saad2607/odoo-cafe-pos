import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';

const router = Router();

function mapBooking(b: {
  _id: unknown;
  customerName: string;
  email?: string;
  phone?: string;
  bookingDate: Date;
  bookingTime: string;
  partySize: number;
  status: string;
  notes?: string;
  tableId?: { _id?: unknown; tableNumber?: number } | unknown;
}) {
  return {
    id: String(b._id),
    customerName: b.customerName,
    email: b.email ?? null,
    phone: b.phone ?? null,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime,
    partySize: b.partySize,
    status: b.status,
    notes: b.notes ?? null,
    table: b.tableId && typeof b.tableId === 'object'
      ? { id: String((b.tableId as { _id: unknown })._id), tableNumber: (b.tableId as { tableNumber: number }).tableNumber }
      : null,
  };
}

const bookingSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  bookingDate: z.string().min(1),
  bookingTime: z.string().min(1),
  partySize: z.number().int().min(1),
  tableId: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

router.get('/', authenticate, async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const status = req.query.status as string | undefined;
    const filter: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.bookingDate = { $gte: d, $lt: next };
    }
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('tableId', 'tableNumber')
      .sort({ bookingDate: 1, bookingTime: 1 });
    return res.json({ bookings: bookings.map(mapBooking) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = bookingSchema.parse(req.body);
    const booking = await Booking.create({
      customerName: data.customerName,
      email: data.email || undefined,
      phone: data.phone,
      bookingDate: new Date(data.bookingDate),
      bookingTime: data.bookingTime,
      partySize: data.partySize,
      tableId: data.tableId || undefined,
      status: data.status ?? 'PENDING',
      notes: data.notes,
      createdBy: req.user!.userId,
    });
    await booking.populate('tableId', 'tableNumber');
    return res.status(201).json({ booking: mapBooking(booking) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = bookingSchema.partial().parse(req.body);
    const update: Record<string, unknown> = { ...data };
    if (data.bookingDate) update.bookingDate = new Date(data.bookingDate);
    if (data.email === '') update.email = undefined;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('tableId', 'tableNumber');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    return res.json({ booking: mapBooking(booking) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    return res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    return res.json({ message: 'Booking deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
