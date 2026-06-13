// Real breakfast menu — savoury & sweet (prices from cafe menu)

import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User, ProductCategory, Product, Floor,
  RestaurantTable, Coupon, Promotion, Customer,
} from '../models/index.js';

const MENU = [
  // SAVOURY
  { name: 'Pesto Eggs on Toast', image: '/foods/pesto-eggs-toast.jpg', price: 372, cat: 'Savoury', color: '#9E4B3A', desc: 'Smashed avocado, feta, marinated tomatoes, basil pesto, sourdough', veg: true },
  { name: 'Eggs Kejriwal', image: '/foods/eggs-kejriwal.jpg', price: 372, cat: 'Savoury', color: '#9E4B3A', desc: 'Cheese chilli toast, thecha babka, coconut avocado chutney, fried eggs' },
  { name: 'Miso Scrambled Eggs', image: '/foods/miso-scrambled-eggs.jpg', price: 321, cat: 'Savoury', color: '#9E4B3A', desc: 'White miso scrambled eggs, furikake, pickled shallots, sourdough' },
  { name: 'Khao Soi Eggs Benedict', image: '/foods/khao-soi-benedict.jpg', price: 392, cat: 'Savoury', color: '#9E4B3A', desc: 'Crispy noodles, soft poached eggs, curry hollandaise' },
  { name: 'Akuri Style Bhurji', image: '/foods/akuri-bhurji.jpg', price: 321, cat: 'Savoury', color: '#9E4B3A', desc: 'Spicy Parsi scrambled eggs, crispy onions, green chutney, cheddar' },
  { name: 'Big Brekkie', image: '/foods/big-brekkie.jpg', price: 393, cat: 'Savoury', color: '#9E4B3A', desc: 'Chicken sausages, avocado, grilled tomato, beans, watermelons, choice of eggs' },
  { name: 'Beetroot Avocado Toast', image: '/foods/beetroot-avocado-toast.jpg', price: 343, cat: 'Savoury', color: '#9E4B3A', desc: 'Whipped feta, roasted beets, fried onion, dukkah, pickles', veg: true },
  { name: 'Skillet Croque Monsieur', image: '/foods/croque-monsieur.jpg', price: 412, cat: 'Savoury', color: '#9E4B3A', desc: 'Ham & cheese scrambled eggs, mornay sauce, bacon crumble, sourdough' },
  { name: 'Veg Ragout & Herb Labneh', image: '/foods/veg-ragout-labneh.jpg', price: 343, cat: 'Savoury', color: '#9E4B3A', desc: 'Soft herb labneh, roasted vegetable ragout, chilli crisp, sourdough', veg: true },
  // SWEET
  { name: 'Tropical Smoothie Bowl', image: '/foods/tropical-smoothie.jpg', price: 343, cat: 'Sweet', color: '#C4785A', desc: 'Coconut milk, mango, passion fruit, granola & fruits', veg: true },
  { name: 'Cocoa Raspberry Smoothie Bowl', image: '/foods/cocoa-raspberry-smoothie.jpg', price: 343, cat: 'Sweet', color: '#C4785A', desc: 'Granola, yoghurt, fresh fruit and mixed nuts', veg: true },
  { name: 'Granola Bowl', image: '/foods/granola-bowl.jpg', price: 343, cat: 'Sweet', color: '#C4785A', desc: 'Greek yoghurt, house granola, roasted peach and poached rhubarb', veg: true },
  { name: 'Honey Butter French Toast', image: '/foods/honey-french-toast.jpg', price: 351, cat: 'Sweet', color: '#C4785A', desc: 'Brioche toast, vanilla custard, poached rhubarb, granola & honeycomb', veg: true },
  { name: 'Ricotta Pancakes', image: '/foods/ricotta-pancakes.jpg', price: 351, cat: 'Sweet', color: '#C4785A', desc: 'Maple, berries, whipped mascarpone & white chocolate crumble', veg: true },
];

export async function seedDatabase() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  if (!(await User.findOne({ email: 'admin@cafe.com' }))) {
    await User.create({ name: 'Cafe Admin', email: 'admin@cafe.com', password: adminPassword, role: 'ADMIN' });
  }
  if (!(await User.findOne({ email: 'cashier@cafe.com' }))) {
    await User.create({ name: 'John Cashier', email: 'cashier@cafe.com', password: cashierPassword, role: 'EMPLOYEE' });
  }

  // Remove old categories
  const oldCats = ['Toast & Brunch', 'Smoothie Bowls', 'Cafe Bowls', 'Beverages', 'Snacks'];
  const categoryMap = new Map<string, string>();

  for (const item of MENU) {
    if (!categoryMap.has(item.cat)) {
      let cat = await ProductCategory.findOne({ name: item.cat });
      if (!cat) cat = await ProductCategory.create({ name: item.cat, color: item.color });
      else { cat.color = item.color; await cat.save(); }
      categoryMap.set(item.cat, String(cat._id));
    }
  }

  const menuNames = MENU.map((m) => m.name);
  for (const item of MENU) {
    await Product.findOneAndUpdate(
      { name: item.name },
      {
        name: item.name,
        categoryId: categoryMap.get(item.cat)!,
        price: item.price,
        unitOfMeasure: 'per serving',
        tax: 5,
        description: item.desc,
        imageUrl: item.image,
        isActive: true,
        sendToKitchen: true,
      },
      { upsert: true, new: true },
    );
  }

  // Deactivate products not in menu
  await Product.updateMany({ name: { $nin: menuNames } }, { isActive: false });

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
      name: 'Big Order Discount',
      triggerType: 'ORDER',
      minOrderAmount: 700,
      discountType: 'FIXED',
      discountValue: 50,
    });
  }
  if (!(await Customer.findOne({ email: 'jane@example.com' }))) {
    await Customer.create({ name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-0100' });
  }

  console.log('  Seed: breakfast menu ready (14 items, real photos)');
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB().then(seedDatabase).then(() => disconnectDB()).catch(console.error);
}
