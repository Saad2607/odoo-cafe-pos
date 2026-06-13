import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { resolveProductImageUrl } from './productImages.js';

export async function refreshAllProductImages() {
  const products = await Product.find({ isActive: true }).populate('categoryId', 'name');
  console.log(`Refreshing images for ${products.length} products…`);

  let updated = 0;
  const BATCH = 50;
  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH);
    await Promise.all(chunk.map(async (p) => {
      const categoryName = p.categoryId && typeof p.categoryId === 'object' && 'name' in p.categoryId
        ? String((p.categoryId as { name: string }).name)
        : undefined;
      const imageUrl = resolveProductImageUrl(p.name, categoryName);
      const needsUpdate = !p.imageUrl
        || p.imageUrl.includes('pollinations.ai')
        || p.imageUrl.startsWith('/foods/')
        || p.imageUrl !== imageUrl;
      if (needsUpdate) {
        p.imageUrl = imageUrl;
        await p.save();
        updated += 1;
      }
    }));
  }
  console.log(`Done — ${updated} images updated.`);
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB()
    .then(refreshAllProductImages)
    .then(() => disconnectDB())
    .catch(console.error);
}
