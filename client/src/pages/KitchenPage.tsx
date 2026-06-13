import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getFoodImage } from '../lib/foodImages';
import { fetchKitchenQueue, Order, toggleKitchenItem, updateKitchenStatus } from '../lib/api';
import '../styles/pos.css';
import '../styles/cafe-menu.css';

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

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback((q?: string) => {
    fetchKitchenQueue(q)
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load queue'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(() => loadQueue(search.trim() || undefined), 8000);
    return () => clearInterval(timer);
  }, [loadQueue, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    loadQueue(search.trim() || undefined);
  }

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.kitchenStatus];
    if (!next) return;
    try {
      await updateKitchenStatus(order.id, next);
      loadQueue(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleItemToggle(order: Order, itemId: string) {
    try {
      await toggleKitchenItem(order.id, itemId);
      loadQueue(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  }

  return (
    <AppLayout title="Kitchen" subtitle="Live order queue">
      <div className="pos-page kitchen-page">
        <form className="kitchen-search" onSubmit={handleSearch}>
          <input
            className="pill-input"
            placeholder="Search orders or items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="terminal-btn cafe-btn-outline">Search</button>
        </form>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}

        <div className="kitchen-grid">
          {orders.map((order) => (
            <article key={order.id} className={`kitchen-card cafe-kitchen-card status-${order.kitchenStatus.toLowerCase()}`}>
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
                    <li
                      key={itemKey}
                      className={`kitchen-item${item.kitchenDone ? ' kitchen-item-done' : ''}`}
                    >
                      <button
                        type="button"
                        className="kitchen-item-btn"
                        onClick={() => item.id && handleItemToggle(order, item.id)}
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
                <div className="kitchen-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary kitchen-action-btn"
                    onClick={() => advanceStatus(order)}
                  >
                    {order.kitchenStatus === 'PENDING' && 'Start Preparing'}
                    {order.kitchenStatus === 'PREPARING' && 'Mark Completed'}
                    {order.kitchenStatus === 'READY' && 'Mark Served'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {!loading && orders.length === 0 && (
          <div className="kitchen-empty"><p>No orders in kitchen</p></div>
        )}
      </div>
    </AppLayout>
  );
}
