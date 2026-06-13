import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { cancelOrder, fetchSessionOrders, Order } from '../lib/api';
import '../styles/orders.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  DRAFT: 'Draft',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function loadOrders(q?: string) {
    setLoading(true);
    fetchSessionOrders(q)
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadOrders(search.trim() || undefined);
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Cancel this draft order?')) return;
    try {
      await cancelOrder(orderId);
      setMessage('Order cancelled');
      loadOrders(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  return (
    <AppLayout title="Orders" subtitle="Current session">
      <div className="orders-page">
        <form className="orders-search" onSubmit={handleSearch}>
          <input
            className="pill-input"
            placeholder="Search by order # or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="terminal-btn cafe-btn-outline">Search</button>
        </form>

        {loading && <p className="pos-muted">Loading orders…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        {!loading && orders.length === 0 && (
          <p className="pos-muted">No orders in this session yet.</p>
        )}

        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className={`order-card status-${order.status.toLowerCase()}`}>
              <div className="order-card-head">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span className={`order-badge badge-${order.status.toLowerCase()}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <strong className="order-amount">₹{order.amount.toFixed(0)}</strong>
              </div>

              <div className="order-card-meta">
                {order.table && <span>Table {order.table.tableNumber}</span>}
                {order.customer && <span>{order.customer.name}</span>}
                {order.paymentMethod && <span>{order.paymentMethod}</span>}
                <span>{new Date(order.date).toLocaleTimeString()}</span>
              </div>

              <ul className="order-card-items">
                {order.items.map((item) => (
                  <li key={item.productId}>{item.productName} ×{item.quantity}</li>
                ))}
              </ul>

              <div className="order-card-actions">
                <Link to={`/orders/${order.id}`} className="terminal-btn cafe-btn-outline">
                  View Details
                </Link>
                {order.status === 'DRAFT' && order.table && (
                  <Link to={`/order/${order.table.id}`} className="terminal-btn cafe-btn-outline">
                    Edit / Pay
                  </Link>
                )}
                {order.status === 'DRAFT' && (
                  <button
                    type="button"
                    className="terminal-btn cafe-btn-danger"
                    onClick={() => handleCancel(order.id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
