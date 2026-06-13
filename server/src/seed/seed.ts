import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User, ProductCategory, Product, Floor,
  RestaurantTable, Coupon, Promotion, Customer, ComboMeal,
} from '../models/index.js';
import { generateCatalogProducts, getCatalogStats } from './menuCatalog.js';
import { refreshAllProductImages } from './refreshImages.js';

const MIN_CATALOG_SIZE = 500;

export async function seedDatabase() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  if (!(await User.findOne({ email: 'admin@cafe.com' }))) {
    await User.create({ name: 'Cafe Admin', email: 'admin@cafe.com', password: adminPassword, role: 'ADMIN' });
  }
  if (!(await User.findOne({ email: 'cashier@cafe.com' }))) {
    await User.create({ name: 'John Cashier', email: 'cashier@cafe.com', password: cashierPassword, role: 'EMPLOYEE' });
  }

  const activeCount = await Product.countDocuments({ isActive: true });
  if (activeCount < MIN_CATALOG_SIZE) {
    console.log('  Seed: building mega menu catalog (500+ items)…');
    const catalog = generateCatalogProducts();
    const categoryMap = new Map<string, string>();

    for (const item of catalog) {
      if (!categoryMap.has(item.category)) {
        let cat = await ProductCategory.findOne({ name: item.category });
        if (!cat) cat = await ProductCategory.create({ name: item.category, color: item.color });
        else { cat.color = item.color; await cat.save(); }
        categoryMap.set(item.category, String(cat._id));
      }
    }

    const catalogNames = catalog.map((m) => m.name);
    const BATCH = 100;
    for (let i = 0; i < catalog.length; i += BATCH) {
      const chunk = catalog.slice(i, i + BATCH);
      await Promise.all(chunk.map((item) =>
        Product.findOneAndUpdate(
          { name: item.name },
          {
            name: item.name,
            categoryId: categoryMap.get(item.category)!,
            price: item.price,
            unitOfMeasure: 'per serving',
            tax: 5,
            description: item.description,
            imageUrl: item.imageUrl ?? null,
            isActive: true,
            sendToKitchen: item.sendToKitchen,
            tags: item.tags,
            isBestseller: item.isBestseller,
            isNewArrival: item.isNew,
            spiceLevel: item.spiceLevel,
          },
          { upsert: true },
        ),
      ));
    }

    await Product.updateMany({ name: { $nin: catalogNames } }, { isActive: false });

    const stats = getCatalogStats(catalog);
    console.log(`  Seed: ${stats.totalProducts} products · ${stats.totalCategories} categories · ${stats.bestsellers} bestsellers`);
  } else {
    console.log(`  Seed: catalog ready (${activeCount} active products)`);
  }

  await refreshAllProductImages();

  let groundFloor = await Floor.findOne({ name: 'Ground Floor' });
  if (!groundFloor) groundFloor = await Floor.create({ name: 'Ground Floor' });

  for (let t = 1; t <= 8; t++) {
    if (!(await RestaurantTable.findOne({ floorId: groundFloor._id, tableNumber: t }))) {
      await RestaurantTable.create({ tableNumber: t, seats: t <= 4 ? 4 : 6, floorId: groundFloor._id });
    }
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

  await seedComboMeals();
}

async function seedComboMeals() {
  if (await ComboMeal.countDocuments() > 0) return;

  const findByName = async (name: string) => Product.findOne({ name, isActive: true });
  const findLike = async (pattern: RegExp) => Product.findOne({ name: pattern, isActive: true });

  const combos = [
    {
      name: 'Power Breakfast Combo',
      tagline: 'Start strong',
      description: 'Savoury eggs + fresh juice + artisan coffee',
      discountPercent: 12,
      items: ['Pesto Eggs on Toast', 'Classic Orange', 'Classic Espresso'],
    },
    {
      name: 'Sweet Tooth Combo',
      tagline: 'For dessert lovers',
      description: 'Pancakes, smoothie bowl & mocha',
      discountPercent: 15,
      items: ['Ricotta Pancakes', 'Tropical Smoothie Bowl', 'Classic Mocha'],
    },
    {
      name: 'Indian Feast Combo',
      tagline: 'Spice route special',
      description: 'Butter chicken, biryani & masala chai',
      discountPercent: 10,
      items: ['Classic Butter Chicken', /Royal Biryani/, 'Classic Masala Chai'],
    },
    {
      name: 'Pizza & Chill Combo',
      tagline: 'Shareable vibes',
      description: 'Wood-fired pizza, mocktail & garlic bread',
      discountPercent: 14,
      items: ['Classic Margherita', 'Classic Virgin Mojito', /Garlic Bread/],
    },
    {
      name: 'Healthy Bowl Combo',
      tagline: 'Clean eating',
      description: 'Quinoa bowl, green detox juice & matcha latte',
      discountPercent: 11,
      items: [/Quinoa Bowl/, /Green Detox/, /Matcha Latte/],
    },
    {
      name: 'Kids Party Combo',
      tagline: 'Little ones love it',
      description: 'Mini pizza, nuggets & chocolate shake',
      discountPercent: 18,
      items: [/Mini Pizza/, /Chicken Nuggets/, /Chocolate Shake/],
    },
  ];

  for (const combo of combos) {
    const resolved = [];
    let total = 0;
    for (const item of combo.items) {
      const p = typeof item === 'string'
        ? await findByName(item)
        : await findLike(item);
      if (!p) continue;
      resolved.push({ productId: p._id, quantity: 1 });
      total += p.price;
    }
    if (resolved.length < 2) continue;
    const price = Math.round(total * (1 - combo.discountPercent / 100));
    await ComboMeal.create({
      name: combo.name,
      tagline: combo.tagline,
      description: combo.description,
      price,
      discountPercent: combo.discountPercent,
      items: resolved,
    });
  }
  console.log('  Seed: combo meals ready');
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB().then(seedDatabase).then(() => disconnectDB()).catch(console.error);
}
