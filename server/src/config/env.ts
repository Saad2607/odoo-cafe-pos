// MERN — Environment variables + dynamic seed config

import type { UserRole } from '../models/User.js';

export interface SeedUserConfig {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function seedUser(
  nameKey: string,
  emailKey: string,
  passwordKey: string,
  role: UserRole,
  defaults: SeedUserConfig,
): SeedUserConfig {
  return {
    name: process.env[nameKey] || defaults.name,
    email: process.env[emailKey] || defaults.email,
    password: process.env[passwordKey] || defaults.password,
    role,
  };
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/odoo_cafe_pos',
  useMemoryMongo: process.env.USE_MEMORY_MONGO === 'true',

  seed: {
    admin: seedUser(
      'SEED_ADMIN_NAME',
      'SEED_ADMIN_EMAIL',
      'SEED_ADMIN_PASSWORD',
      'ADMIN',
      { name: 'Cafe Admin', email: 'admin@cafe.com', password: 'admin123', role: 'ADMIN' },
    ),
    cashier: seedUser(
      'SEED_CASHIER_NAME',
      'SEED_CASHIER_EMAIL',
      'SEED_CASHIER_PASSWORD',
      'EMPLOYEE',
      { name: 'John Cashier', email: 'cashier@cafe.com', password: 'cashier123', role: 'EMPLOYEE' },
    ),
  },
};