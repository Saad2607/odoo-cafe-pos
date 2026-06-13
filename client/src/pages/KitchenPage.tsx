import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getFoodImage } from '../lib/foodImages';
import {
  fetchCategories,
  fetchKitchenQueue,
  fetchProducts,
  Order,
  toggleKitchenItem,
  updateKitchenStatus,
} from '../lib/api';
import '../styles/pos.css';
import '../styles/cafe-menu.css';
import '../styles/kds-standalone.css';

const NEXT_STATUS: Record<string, Order['kitchenStatus']> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'To Cook',
  PREPARING: 'Preparing',
  READY: 'Completed',
};

interface KitchenPageProps {
  standalone?: boolean;
}

export default function KitchenPage({ standalone }: KitchenPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback(() => {
    fetchKitchenQueue({
      q: search.trim() || undefined,
      categoryId: categoryId || undefined,
      productId: productId || undefined,
    })
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load queue'))
      .finally(() => setLoading(false));
  }, [search, categoryId, productId]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProducts()])
      .then(([c, p]) => {
        setCategories(c.categories);
        setProducts(p.products.filter((pr) => pr.sendToKitchen !== false).map((pr) => ({ id: pr.id, name: pr.name })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 2000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    loadQueue();
  }

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.kitchenStatus];
    if (!next) return;
    try {
      await updateKitchenStatus(order.id, next);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleItemToggle(e: React.MouseEvent, order: Order, itemId: string) {
    e.stopPropagation();
    try {
      await toggleKitchenItem(order.id, itemId);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  }

  const body = (
    <div className={`pos-page kitchen-page${standalone ? ' kds-standalone-page' : ''}`}>
      <div className="kitchen-live-header">
        <span className="kds-live-badge"><span className="live-dot" /> LIVE</span>
        <span className="kitchen-live-sub">Real-time updates every 2s</span>
        {standalone && <span className="kds-url-badge">KDS — Kitchen Display</span>}
      </div>

      <form className="kitchen-search" onSubmit={handleSearch}>
        <input className="pill-input" placeholder="Search orders or items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="pill-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="pill-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" className="terminal-btn cafe-btn-outline">Filter</button>
      </form>

      {loading && <p className="pos-muted">Loading…</p>}
      {error && <div className="pos-error">{error}</div>}

      <p className="kitchen-hint pos-muted">Click a ticket card to move it to the next stage. Click an item to mark it done.</p>

      <div className="kitchen-grid">
        {orders.map((order) => (
          <article
            key={order.id}
            className={`kitchen-card cafe-kitchen-card kitchen-card-clickable status-${order.kitchenStatus.toLowerCase()}`}
            onClick={() => order.kitchenStatus !== 'SERVED' && advanceStatus(order)}
            onKeyDown={(e) => { if (e.key === 'Enter') advanceStatus(order); }}
            role="button"
            tabIndex={0}
            title="Click card to advance stage"
          >
            <header className="kitchen-card-header">
              <h3>#{order.orderNumber.slice(-6)}</h3>
              <span className="kitchen-pill">{STATUS_LABEL[order.kitchenStatus]}</span>
            </header>
            <p className="kitchen-meta">
              Table {order.table?.tableNumber ?? '—'} · {new Date(order.date).toLocaleTimeString()}
            </p>
            <ul className="kitchen-items">
              {order.items.map((item) => {
                const itemKey = item.id ?? `${order.id}-${item.productId}`;
                return (
                  <li key={itemKey} className={`kitchen-item${item.kitchenDone ? ' kitchen-item-done' : ''}`}>
                    <button
                      type="button"
                      className="kitchen-item-btn"
                      onClick={(e) => item.id && handleItemToggle(e, order, item.id)}
                      disabled={!item.id}
                      title="Mark item done"
                    >
                      <img src={getFoodImage(item.productName)} alt="" className="kitchen-item-photo" />
                      <span className="kitchen-item-name">
                        <strong>{item.productName}</strong> ×{item.quantity}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {order.kitchenStatus !== 'SERVED' && (
              <p className="kitchen-tap-hint">Tap card → {STATUS_LABEL[NEXT_STATUS[order.kitchenStatus]]}</p>
            )}
          </article>
        ))}
      </div>

      {!loading && orders.length === 0 && (
        <div className="kitchen-empty"><p>No orders in kitchen</p></div>
      )}
    </div>
  );

  if (standalone) return body;
  return <AppLayout title="Kitchen" subtitle="Kitchen Display (KDS)">{body}</AppLayout>;
}
