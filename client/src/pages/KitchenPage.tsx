import { useCallback, useEffect, useState } from 'react';
import TerminalLayout from '../components/TerminalLayout';
import { fetchKitchenQueue, Order, updateKitchenStatus } from '../lib/api';
import '../styles/pos.css';

const NEXT_STATUS: Record<string, Order['kitchenStatus']> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'New',
  PREPARING: 'Cooking',
  READY: 'Ready',
  SERVED: 'Served',
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback(() => {
    fetchKitchenQueue()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load kitchen queue'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 8000);
    return () => clearInterval(timer);
  }, [loadQueue]);

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.kitchenStatus];
    if (!next) return;

    try {
      await updateKitchenStatus(order.id, next);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <TerminalLayout title="Kitchen Display" subtitle="Live order queue">
      <div className="pos-page kitchen-page">
        {loading && <p className="pos-muted">Loading kitchen queue…</p>}
        {error && <div className="pos-error">{error}</div>}

        <div className="kitchen-grid">
          {orders.map((order) => (
            <article key={order.id} className={`kitchen-card status-${order.kitchenStatus.toLowerCase()}`}>
              <header>
                <h3>#{order.orderNumber}</h3>
                <span className="kitchen-pill">{STATUS_LABEL[order.kitchenStatus] || order.kitchenStatus}</span>
              </header>
              <p className="pos-muted">
                Table {order.table?.tableNumber ?? '—'} · {new Date(order.date).toLocaleTimeString()}
              </p>
              <ul className="kitchen-items">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.quantity}× {item.productName}
                  </li>
                ))}
              </ul>
              {order.kitchenStatus !== 'SERVED' && (
                <button
                  type="button"
                  className="terminal-btn terminal-btn-primary"
                  onClick={() => advanceStatus(order)}
                >
                  Mark as {STATUS_LABEL[NEXT_STATUS[order.kitchenStatus]] || 'Next'}
                </button>
              )}
            </article>
          ))}
        </div>

        {!loading && orders.length === 0 && (
          <div className="kitchen-empty">
            <p>No orders in the kitchen right now.</p>
          </div>
        )}
      </div>
    </TerminalLayout>
  );
}
