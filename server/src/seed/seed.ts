// Demo data for jury presentation

import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User, ProductCategory, Product, Floor,
  RestaurantTable, Coupon, Promotion, Customer,
} from '../models/index.js';

export async function seedDatabase() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  if (!(await User.findOne({ email: 'admin@cafe.com' }))) {
    await User.create({
      name: 'Cafe Admin', email: 'admin@cafe.com',
      password: adminPassword, role: 'ADMIN',
    });
  }

  if (!(await User.findOne({ email: 'cashier@cafe.com' }))) {
    await User.create({
      name: 'John Cashier', email: 'cashier@cafe.com',
      password: cashierPassword, role: 'EMPLOYEE',
    });
  }

  let beverages = await ProductCategory.findOne({ name: 'Beverages' });
  if (!beverages) beverages = await ProductCategory.create({ name: 'Beverages', color: '#6B4E71' });

  let snacks = await ProductCategory.findOne({ name: 'Snacks' });
  if (!snacks) snacks = await ProductCategory.create({ name: 'Snacks', color: '#E07A5F' });

  if (!(await Product.findOne({ name: 'Espresso' }))) {
    await Product.create({
      name: 'Espresso', categoryId: beverages._id,
      price: 3.5, unitOfMeasure: 'per piece', tax: 5,
      description: 'Rich Italian espresso shot',
    });
  }

  if (!(await Product.findOne({ name: 'Butter Croissant' }))) {
    await Product.create({
      name: 'Butter Croissant', categoryId: snacks._id,
      price: 4.0, unitOfMeasure: 'per piece', tax: 5,
      description: 'Flaky buttery croissant',
    });
  }

  let groundFloor = await Floor.findOne({ name: 'Ground Floor' });
  if (!groundFloor) groundFloor = await Floor.create({ name: 'Ground Floor' });

  if (!(await RestaurantTable.findOne({ floorId: groundFloor._id, tableNumber: 1 }))) {
    await RestaurantTable.create({ tableNumber: 1, seats: 4, floorId: groundFloor._id });
  }

  if (!(await RestaurantTable.findOne({ floorId: groundFloor._id, tableNumber: 2 }))) {
    await RestaurantTable.create({ tableNumber: 2, seats: 2, floorId: groundFloor._id });
  }

  if (!(await Coupon.findOne({ code: 'WELCOME10' }))) {
    await Coupon.create({ code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10 });
  }

  if (!(await Promotion.findOne({ name: 'Big Order Discount' }))) {
    await Promotion.create({
      name: 'Big Order Discount', triggerType: 'ORDER',
      minOrderAmount: 50, discountType: 'FIXED', discountValue: 5,
    });
  }

  if (!(await Customer.findOne({ email: 'jane@example.com' }))) {
    await Customer.create({ name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-0100' });
  }

  console.log('  Seed: demo data ready (admin@cafe.com / admin123)');
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB().then(seedDatabase).then(() => disconnectDB()).catch(console.error);
}