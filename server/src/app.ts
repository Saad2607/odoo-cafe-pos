// E in MERN — Express app (middleware + routes)

import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/session.js';
import productRoutes from './routes/products.js';
import floorRoutes from './routes/floors.js';
import orderRoutes from './routes/orders.js';
import kitchenRoutes from './routes/kitchen.js';
import couponRoutes from './routes/coupons.js';
import paymentSettingsRoutes from './routes/paymentSettings.js';
import customerRoutes from './routes/customers.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';
import discountRoutes from './routes/discounts.js';
import reportRoutes from './routes/reports.js';
import bookingRoutes from './routes/bookings.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    stack: 'MERN',
    phase: 'Phase 6 - Booking, KDS filters, Receipt & Reports',
    database: 'MongoDB',
    backend: 'Express + Node.js',
    frontend: 'React (port 5173)',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bookings', bookingRoutes);

export default app;