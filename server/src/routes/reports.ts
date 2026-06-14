import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { PosSession } from '../models/PosSession.js';

const router = Router();

function periodStart(period: string): Date | null {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const period = (req.query.period as string) || 'today';
    const employeeId = req.query.employeeId as string | undefined;
    const sessionId = req.query.sessionId as string | undefined;
    const productId = req.query.productId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;

    const filter: Record<string, unknown> = { status: 'PAID' };

    if (fromDate || toDate) {
      const range: Record<string, Date> = {};
      if (fromDate) range.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setDate(end.getDate() + 1);
        range.$lt = end;
      }
      filter.date = range;
    } else {
      const start = periodStart(period);
      if (start) filter.date = { $gte: start };
    }

    if (employeeId) filter.employeeId = employeeId;
    if (sessionId) filter.sessionId = sessionId;
    if (productId) filter['items.productId'] = productId;

    const orders = await Order.find(filter).sort({ date: -1 });

    const totalOrders = orders.length;
    const revenue = orders.reduce((s, o) => s + o.amount, 0);
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;

    const allOrdersFilter: Record<string, unknown> = { status: { $ne: 'CANCELLED' } };
    if (filter.date) allOrdersFilter.date = filter.date;
    if (employeeId) allOrdersFilter.employeeId = employeeId;
    if (sessionId) allOrdersFilter.sessionId = sessionId;
    if (productId) allOrdersFilter['items.productId'] = productId;
    const allOrderCount = await Order.countDocuments(allOrdersFilter);

    const dayMap = new Map<string, { revenue: number; count: number }>();
    for (const o of orders) {
      const key = new Date(o.date).toISOString().slice(0, 10);
      const cur = dayMap.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += o.amount;
      cur.count += 1;
      dayMap.set(key, cur);
    }
    const salesTrend = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, revenue: Math.round(v.revenue), orders: v.count }));

    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const key = String(item.productId);
        const cur = productMap.get(key) ?? { name: item.productName, qty: 0, revenue: 0 };
        cur.qty += item.quantity;
        cur.revenue += item.lineTotal;
        productMap.set(key, cur);
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const products = await Product.find().populate('categoryId', 'name');
    const catNameByProduct = new Map(products.map((p) => [String(p._id), (p.categoryId as { name?: string })?.name ?? 'Other']));
    const catMap = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) {
        const cat = catNameByProduct.get(String(item.productId)) ?? 'Other';
        catMap.set(cat, (catMap.get(cat) ?? 0) + item.lineTotal);
      }
    }
    const topCategories = Array.from(catMap.entries())
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue);

    const topOrders = orders
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((o) => ({
        orderNumber: o.orderNumber,
        date: o.date,
        amount: o.amount,
      }));

    const [employees, sessions, allProducts] = await Promise.all([
      User.find({ role: 'EMPLOYEE' }).select('name email'),
      PosSession.find().sort({ openedAt: -1 }).limit(20),
      Product.find({ isActive: true }).select('name'),
    ]);

    return res.json({
      metrics: {
        totalOrders,
        allOrderCount,
        revenue: Math.round(revenue),
        avgOrderValue: Math.round(avgOrder),
      },
      salesTrend,
      topProducts,
      topCategories,
      topOrders,
      filters: {
        employees: employees.map((e) => ({ id: String(e._id), name: e.name })),
        sessions: sessions.map((s) => ({
          id: String(s._id),
          sessionNumber: s.sessionNumber,
          openedAt: s.openedAt,
        })),
        products: allProducts.map((p) => ({ id: String(p._id), name: p.name })),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
