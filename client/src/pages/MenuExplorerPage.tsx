import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FoodCard from '../components/FoodCard';
import {
  fetchCategories,
  fetchProductStats,
  fetchProducts,
  Category,
  Product,
  ProductStats,
} from '../lib/api';
import '../styles/cafe-menu.css';
import '../styles/menu-explorer.css';

const TAG_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'VEG', label: '🌿 Veg' },
  { id: 'SPICY', label: '🌶️ Spicy' },
  { id: 'bestseller', label: '⭐ Bestsellers' },
  { id: 'new', label: '✨ New' },
] as const;

export default function MenuExplorerPage() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [surprise, setSurprise] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([fetchProductStats(), fetchCategories()])
      .then(([s, c]) => {
        setStats(s);
        setCategories(c.categories);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stats'));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Parameters<typeof fetchProducts>[0] = {};
    if (categoryId !== 'all') params.categoryId = categoryId;
    if (tagFilter === 'VEG' || tagFilter === 'SPICY') params.tag = tagFilter;
    if (tagFilter === 'bestseller') params.bestseller = true;
    if (tagFilter === 'new') params.new = true;
    if (search.trim()) params.q = search.trim();

    const timer = setTimeout(() => {
      fetchProducts(params)
        .then((res) => setProducts(res.products))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load menu'))
        .finally(() => setLoading(false));
    }, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [categoryId, tagFilter, search]);

  const grouped = useMemo(() => {
    if (categoryId !== 'all') {
      const cat = categories.find((c) => c.id === categoryId)
        ?? stats?.categories.find((c) => c.id === categoryId);
      return cat ? [{ id: categoryId, cat, products }] : [];
    }
    const map = new Map<string, { cat: Category; items: Product[] }>();
    for (const p of products) {
      if (!p.category) continue;
      const key = p.category.id;
      if (!map.has(key)) map.set(key, { cat: p.category, items: [] });
      map.get(key)!.items.push(p);
    }
    return Array.from(map.values()).map((g) => ({ id: g.cat.id, cat: g.cat, products: g.items }));
  }, [products, categoryId, categories, stats]);

  function handleSurpriseMe() {
    if (!products.length) return;
    const pick = products[Math.floor(Math.random() * products.length)];
    setSurprise(pick);
    setTimeout(() => setSurprise(null), 5000);
  }

  return (
    <AppLayout title="Menu Explorer" subtitle="Browse 500+ items across 18 categories">
      <div className="menu-explorer-page">
        {stats && (
          <section className="explorer-stats-banner">
            <div className="explorer-stat">
              <strong>{stats.totalProducts}</strong>
              <span>Products</span>
            </div>
            <div className="explorer-stat">
              <strong>{stats.totalCategories}</strong>
              <span>Categories</span>
            </div>
            <div className="explorer-stat">
              <strong>{stats.bestsellers}</strong>
              <span>Bestsellers</span>
            </div>
            <div className="explorer-stat">
              <strong>{stats.vegItems}</strong>
              <span>Veg Options</span>
            </div>
            <button type="button" className="explorer-surprise-btn" onClick={handleSurpriseMe}>
              🎲 Surprise Me
            </button>
          </section>
        )}

        {surprise && (
          <div className="explorer-surprise-toast">
            Try <strong>{surprise.name}</strong> — ₹{surprise.price} · {surprise.category?.name}
          </div>
        )}

        <div className="explorer-toolbar">
          <input
            className="pill-input explorer-search"
            placeholder="Search 500+ dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/floor" className="terminal-btn cafe-btn-primary">Order at Table →</Link>
        </div>

        <div className="explorer-tag-filters">
          {TAG_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`explorer-tag-chip${tagFilter === f.id ? ' active' : ''}`}
              onClick={() => setTagFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="explorer-category-rail">
          <button
            type="button"
            className={`explorer-cat-chip${categoryId === 'all' ? ' active' : ''}`}
            onClick={() => setCategoryId('all')}
          >
            All Categories
          </button>
          {(stats?.categories ?? categories).map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`explorer-cat-chip${categoryId === cat.id ? ' active' : ''}`}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
              onClick={() => setCategoryId(cat.id)}
            >
              {cat.name}
              {'count' in cat ? <span className="explorer-cat-count">{String((cat as Category & { count: number }).count)}</span> : null}
            </button>
          ))}
        </div>

        {error && <div className="pos-error">{error}</div>}
        {loading && <p className="pos-muted">Loading menu…</p>}

        {!loading && products.length === 0 && (
          <p className="pos-muted explorer-empty">No items match your filters.</p>
        )}

        {!loading && categoryId === 'all' && grouped.length > 0 && (
          <p className="explorer-result-count">{products.length} items shown</p>
        )}

        {!loading && grouped.map((group) => {
          const { cat, products: items } = group;
          if (!items.length) return null;
          return (
            <section
              key={group.id}
              className="explorer-category-section"
              style={{ borderColor: cat?.color ?? '#9E4B3A' }}
            >
              <h3 style={{ color: cat?.color }}>{cat?.name ?? 'Menu'}</h3>
              <div className="product-grid cafe-food-grid explorer-grid">
                {items.map((product) => (
                  <FoodCard
                    key={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    tax={product.tax}
                    imageUrl={product.imageUrl}
                    accent={cat?.color}
                    categoryName={cat?.name}
                    vegetarian={product.tags?.includes('VEG')}
                    badges={[
                      product.isBestseller ? '⭐' : '',
                      product.isNewArrival ? 'NEW' : '',
                      (product.spiceLevel ?? 0) > 0 ? '🌶️'.repeat(product.spiceLevel!) : '',
                    ].filter(Boolean)}
                    disabled
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppLayout>
  );
}
