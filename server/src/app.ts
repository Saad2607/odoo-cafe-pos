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

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    stack: 'MERN',
    phase: 'Phase 2 - Floor Plan, Orders & Kitchen',
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

export default app;