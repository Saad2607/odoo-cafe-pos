import { assignImagesToCatalog } from './productImages.js';

export interface CatalogProduct {
  name: string;
  category: string;
  color: string;
  price: number;
  description: string;
  imageUrl?: string;
  tags: string[];
  isBestseller: boolean;
  isNew: boolean;
  spiceLevel: number;
  sendToKitchen: boolean;
}

export interface CatalogCategory {
  name: string;
  color: string;
  emoji: string;
  bases: string[];
  styles: string[];
  priceMin: number;
  priceMax: number;
  vegRatio: number;
  spicyRatio: number;
  count: number;
}

const STYLES = ['Classic', 'Signature', 'Chef\'s', 'Premium', 'Street', 'Homestyle', 'Artisan', 'Royal', 'Garden', 'Smoky', 'Crispy', 'Velvet', 'Golden', 'Spiced', 'Fresh', 'Slow-cooked'];

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { name: 'Savoury Breakfast', color: '#9E4B3A', emoji: '🍳', bases: ['Eggs Benedict', 'Avocado Toast', 'Shakshuka', 'Breakfast Burrito', 'Croque Monsieur', 'Full English', 'Akuri', 'Frittata', 'Bagel & Lox'], styles: STYLES, priceMin: 280, priceMax: 450, vegRatio: 0.35, spicyRatio: 0.2, count: 32 },
  { name: 'Sweet Breakfast', color: '#C4785A', emoji: '🥞', bases: ['Pancakes', 'French Toast', 'Waffles', 'Smoothie Bowl', 'Granola Parfait', 'Crepe', 'Chia Pudding', 'Banana Bread', 'Cinnamon Roll'], styles: STYLES, priceMin: 260, priceMax: 420, vegRatio: 0.9, spicyRatio: 0, count: 32 },
  { name: 'Coffee & Espresso', color: '#5D4037', emoji: '☕', bases: ['Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha', 'Flat White', 'Cold Brew', 'Affogato', 'Macchiato'], styles: STYLES, priceMin: 120, priceMax: 280, vegRatio: 0.95, spicyRatio: 0, count: 32, },
  { name: 'Artisan Teas', color: '#6B8E23', emoji: '🍵', bases: ['Masala Chai', 'Green Tea', 'Earl Grey', 'Matcha Latte', 'Hibiscus Iced Tea', 'Chamomile', 'Oolong', 'Kashmiri Kahwa', 'Butterfly Pea Tea'], styles: STYLES, priceMin: 100, priceMax: 220, vegRatio: 1, spicyRatio: 0.1, count: 30 },
  { name: 'Fresh Juices', color: '#F9A825', emoji: '🍊', bases: ['Orange', 'Watermelon', 'Pomegranate', 'Green Detox', 'Carrot Ginger', 'Pineapple Mint', 'Beetroot Apple', 'Mixed Citrus', 'Amla Shot'], styles: STYLES, priceMin: 140, priceMax: 260, vegRatio: 1, spicyRatio: 0.05, count: 30 },
  { name: 'Smoothies & Shakes', color: '#E91E63', emoji: '🥤', bases: ['Mango Shake', 'Berry Blast', 'Protein Smoothie', 'Chocolate Shake', 'Avocado Smoothie', 'Peanut Butter Shake', 'Tropical Blend', 'Dates & Almond', 'Coffee Frappe'], styles: STYLES, priceMin: 180, priceMax: 320, vegRatio: 0.85, spicyRatio: 0, count: 32 },
  { name: 'Salads & Bowls', color: '#43A047', emoji: '🥗', bases: ['Caesar Salad', 'Greek Bowl', 'Quinoa Bowl', 'Buddha Bowl', 'Poke Bowl', 'Mediterranean Salad', 'Kale & Avocado', 'Thai Crunch', 'Protein Power Bowl'], styles: STYLES, priceMin: 280, priceMax: 480, vegRatio: 0.55, spicyRatio: 0.15, count: 32 },
  { name: 'Gourmet Sandwiches', color: '#8D6E63', emoji: '🥪', bases: ['Club Sandwich', 'BLT', 'Grilled Cheese', 'Chicken Panini', 'Veggie Sub', 'Tuna Melt', 'Pulled Pork', 'Caprese', 'Falafel Wrap'], styles: STYLES, priceMin: 220, priceMax: 380, vegRatio: 0.4, spicyRatio: 0.2, count: 32 },
  { name: 'Pasta & Risotto', color: '#FF8F00', emoji: '🍝', bases: ['Aglio Olio', 'Alfredo', 'Arrabiata', 'Carbonara', 'Pesto Pasta', 'Lasagna', 'Mushroom Risotto', 'Seafood Linguine', 'Truffle Mac'], styles: STYLES, priceMin: 320, priceMax: 550, vegRatio: 0.35, spicyRatio: 0.25, count: 32 },
  { name: 'Wood-Fired Pizza', color: '#D84315', emoji: '🍕', bases: ['Margherita', 'Pepperoni', 'Four Cheese', 'BBQ Chicken', 'Veg Supreme', 'Truffle Mushroom', 'Diavola', 'Hawaiian', 'Paneer Tikka Pizza'], styles: STYLES, priceMin: 350, priceMax: 580, vegRatio: 0.4, spicyRatio: 0.3, count: 32 },
  { name: 'Indian Classics', color: '#FF6F00', emoji: '🍛', bases: ['Butter Chicken', 'Paneer Tikka', 'Dal Makhani', 'Biryani', 'Palak Paneer', 'Chole Bhature', 'Dosa', 'Kathi Roll', 'Thali'], styles: STYLES, priceMin: 280, priceMax: 520, vegRatio: 0.45, spicyRatio: 0.55, count: 34 },
  { name: 'Asian Street Food', color: '#C62828', emoji: '🥡', bases: ['Pad Thai', 'Ramen Bowl', 'Dumplings', 'Korean Fried Rice', 'Teriyaki Bowl', 'Spring Rolls', 'Pho', 'Sushi Roll', 'Bao Bun'], styles: STYLES, priceMin: 300, priceMax: 520, vegRatio: 0.35, spicyRatio: 0.4, count: 32 },
  { name: 'Burgers & Grill', color: '#4E342E', emoji: '🍔', bases: ['Classic Burger', 'Chicken Burger', 'Veggie Burger', 'Lamb Chops', 'Grilled Fish', 'Steak Frites', 'BBQ Wings', 'Kebab Platter', 'Loaded Fries'], styles: STYLES, priceMin: 320, priceMax: 620, vegRatio: 0.25, spicyRatio: 0.35, count: 32 },
  { name: 'Desserts & Bakery', color: '#AD1457', emoji: '🍰', bases: ['Chocolate Cake', 'Tiramisu', 'Cheesecake', 'Brownie', 'Macaron Box', 'Fruit Tart', 'Ice Cream Sundae', 'Baklava', 'Eclair'], styles: STYLES, priceMin: 180, priceMax: 420, vegRatio: 0.8, spicyRatio: 0, count: 32 },
  { name: 'Snacks & Tapas', color: '#7B1FA2', emoji: '🍟', bases: ['Nachos', 'Bruschetta', 'Hummus Platter', 'Onion Rings', 'Garlic Bread', 'Stuffed Mushroom', 'Chicken Popcorn', 'Samosa', 'Cheese Balls'], styles: STYLES, priceMin: 150, priceMax: 320, vegRatio: 0.5, spicyRatio: 0.3, count: 30 },
  { name: 'Kids Corner', color: '#0288D1', emoji: '🧒', bases: ['Mini Pizza', 'Chicken Nuggets', 'Pasta Butter', 'Fruit Plate', 'Milkshake', 'Grilled Cheese', 'Mini Pancakes', 'Veggie Sticks', 'Mac & Cheese'], styles: STYLES, priceMin: 150, priceMax: 280, vegRatio: 0.6, spicyRatio: 0, count: 28 },
  { name: 'Seasonal Specials', color: '#00897B', emoji: '🌿', bases: ['Winter Soup', 'Summer Salad', 'Festive Platter', 'Monsoon Pakora', 'Harvest Bowl', 'Holiday Roast', 'Spring Risotto', 'Autumn Tart', 'Limited Brunch'], styles: STYLES, priceMin: 300, priceMax: 550, vegRatio: 0.5, spicyRatio: 0.2, count: 30 },
  { name: 'Mocktails & Coolers', color: '#00ACC1', emoji: '🍹', bases: ['Virgin Mojito', 'Blue Lagoon', 'Passion Cooler', 'Cucumber Mint', 'Spiced Lemonade', 'Iced Hibiscus', 'Coconut Fizz', 'Ginger Ale', 'Fruit Punch'], styles: STYLES, priceMin: 160, priceMax: 300, vegRatio: 1, spicyRatio: 0.05, count: 30 },
];

/** Keep original 14 breakfast items with real photos */
export const SIGNATURE_MENU: CatalogProduct[] = [
  { name: 'Pesto Eggs on Toast', category: 'Savoury Breakfast', color: '#9E4B3A', price: 372, description: 'Smashed avocado, feta, marinated tomatoes, basil pesto, sourdough', tags: ['VEG'], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: true },
  { name: 'Eggs Kejriwal', category: 'Savoury Breakfast', color: '#9E4B3A', price: 372, description: 'Cheese chilli toast, thecha babka, coconut avocado chutney, fried eggs', tags: [], isBestseller: true, isNew: false, spiceLevel: 2, sendToKitchen: true },
  { name: 'Miso Scrambled Eggs', category: 'Savoury Breakfast', color: '#9E4B3A', price: 321, description: 'White miso scrambled eggs, furikake, pickled shallots, sourdough', tags: [], isBestseller: false, isNew: true, spiceLevel: 0, sendToKitchen: true },
  { name: 'Khao Soi Eggs Benedict', category: 'Savoury Breakfast', color: '#9E4B3A', price: 392, description: 'Crispy noodles, soft poached eggs, curry hollandaise', tags: [], isBestseller: true, isNew: false, spiceLevel: 2, sendToKitchen: true },
  { name: 'Akuri Style Bhurji', category: 'Savoury Breakfast', color: '#9E4B3A', price: 321, description: 'Spicy Parsi scrambled eggs, crispy onions, green chutney, cheddar', tags: ['SPICY'], isBestseller: false, isNew: false, spiceLevel: 3, sendToKitchen: true },
  { name: 'Big Brekkie', category: 'Savoury Breakfast', color: '#9E4B3A', price: 393, description: 'Chicken sausages, avocado, grilled tomato, beans, watermelons, choice of eggs', tags: [], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: true },
  { name: 'Beetroot Avocado Toast', category: 'Savoury Breakfast', color: '#9E4B3A', price: 343, description: 'Whipped feta, roasted beets, fried onion, dukkah, pickles', tags: ['VEG'], isBestseller: false, isNew: false, spiceLevel: 0, sendToKitchen: true },
  { name: 'Skillet Croque Monsieur', category: 'Savoury Breakfast', color: '#9E4B3A', price: 412, description: 'Ham & cheese scrambled eggs, mornay sauce, bacon crumble, sourdough', tags: [], isBestseller: false, isNew: false, spiceLevel: 0, sendToKitchen: true },
  { name: 'Veg Ragout & Herb Labneh', category: 'Savoury Breakfast', color: '#9E4B3A', price: 343, description: 'Soft herb labneh, roasted vegetable ragout, chilli crisp, sourdough', tags: ['VEG'], isBestseller: false, isNew: true, spiceLevel: 1, sendToKitchen: true },
  { name: 'Tropical Smoothie Bowl', category: 'Sweet Breakfast', color: '#C4785A', price: 343, description: 'Coconut milk, mango, passion fruit, granola & fruits', tags: ['VEG'], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: false },
  { name: 'Cocoa Raspberry Smoothie Bowl', category: 'Sweet Breakfast', color: '#C4785A', price: 343, description: 'Granola, yoghurt, fresh fruit and mixed nuts', tags: ['VEG'], isBestseller: false, isNew: false, spiceLevel: 0, sendToKitchen: false },
  { name: 'Granola Bowl', category: 'Sweet Breakfast', color: '#C4785A', price: 343, description: 'Greek yoghurt, house granola, roasted peach and poached rhubarb', tags: ['VEG'], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: false },
  { name: 'Honey Butter French Toast', category: 'Sweet Breakfast', color: '#C4785A', price: 351, description: 'Brioche toast, vanilla custard, poached rhubarb, granola & honeycomb', tags: ['VEG'], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: true },
  { name: 'Ricotta Pancakes', category: 'Sweet Breakfast', color: '#C4785A', price: 351, description: 'Maple, berries, whipped mascarpone & white chocolate crumble', tags: ['VEG'], isBestseller: true, isNew: false, spiceLevel: 0, sendToKitchen: true },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateCatalogProducts(): CatalogProduct[] {
  const signatureNames = new Set(SIGNATURE_MENU.map((p) => p.name));
  const products: CatalogProduct[] = [...SIGNATURE_MENU];
  const rand = seededRandom(42);
  let seed = 0;

  for (const cat of CATALOG_CATEGORIES) {
    const usedNames = new Set<string>();
    let generated = 0;

    while (generated < cat.count) {
      const style = cat.styles[generated % cat.styles.length];
      const base = cat.bases[generated % cat.bases.length];
      const variant = ['Bowl', 'Plate', 'Special', 'Deluxe', 'Mini', 'Combo', 'Express', 'Feast'][generated % 8];
      let name = `${style} ${base}`;
      if (generated % 3 === 0) name = `${style} ${base} ${variant}`;
      if (generated % 5 === 2) name = `${base} — ${style} Edition`;

      if (signatureNames.has(name) || usedNames.has(name)) {
        name = `${style} ${base} #${generated + 1}`;
      }
      usedNames.add(name);
      signatureNames.add(name);

      const price = Math.round(cat.priceMin + rand() * (cat.priceMax - cat.priceMin));
      const isVeg = rand() < cat.vegRatio;
      const isSpicy = rand() < cat.spicyRatio;
      const spiceLevel = isSpicy ? (rand() < 0.4 ? 3 : rand() < 0.7 ? 2 : 1) : 0;
      const tags: string[] = [];
      if (isVeg) tags.push('VEG');
      if (isSpicy) tags.push('SPICY');
      if (generated % 11 === 0) tags.push('GLUTEN-FREE');

      products.push({
        name,
        category: cat.name,
        color: cat.color,
        price,
        description: `House ${cat.name.toLowerCase()} — ${style.toLowerCase()} ${base.toLowerCase()} prepared fresh at Brivio.`,
        tags,
        isBestseller: generated % 9 === 0,
        isNew: generated % 13 === 0,
        spiceLevel,
        sendToKitchen: !cat.name.includes('Coffee') && !cat.name.includes('Tea') && !cat.name.includes('Juice') && !cat.name.includes('Mocktail') && !cat.name.includes('Smoothies'),
      });
      generated += 1;
      seed += 1;
    }
  }

  return assignImagesToCatalog(products);
}

export function getCatalogStats(products: CatalogProduct[]) {
  const categories = [...new Set(products.map((p) => p.category))];
  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    bestsellers: products.filter((p) => p.isBestseller).length,
    newItems: products.filter((p) => p.isNew).length,
    vegItems: products.filter((p) => p.tags.includes('VEG')).length,
  };
}
