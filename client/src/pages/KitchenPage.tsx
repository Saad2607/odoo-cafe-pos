import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getFoodImage } from '../lib/foodImages';
import { fetchKitchenQueue, Order, updateKitchenStatus } from '../lib/api';
import '../styles/pos.css';
import '../styles/cafe-menu.css';

const NEXT_STATUS: Record<string, Order['kitchenStatus']> = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'New',
  PREPARING: 'Cooking',
  READY: 'Ready',
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback(() => {
    fetchKitchenQueue()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load queue'))
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
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  return (
    <AppLayout title="Kitchen" subtitle="Live order queue">
      <div className="pos-page kitchen-page">
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
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`} className="kitchen-item">
                    <img src={getFoodImage(item.productName)} alt="" className="kitchen-item-photo" />
                    <span className="kitchen-item-name">
                      <strong>{item.productName}</strong> ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              {order.kitchenStatus !== 'SERVED' && (
                <div className="kitchen-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary kitchen-action-btn"
                    onClick={() => advanceStatus(order)}
                  >
                    Mark {STATUS_LABEL[NEXT_STATUS[order.kitchenStatus]]}
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
