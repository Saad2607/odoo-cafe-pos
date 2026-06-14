import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { cancelOrder, fetchSessionOrders, getStoredUser, Order, orderGrandTotal } from '../lib/api';
import { appConfirm } from '../context/DialogContext';
import '../styles/orders.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  DRAFT: 'Draft',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'ADMIN';
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function loadOrders() {
    setLoading(true);
    fetchSessionOrders({
      q: search.trim() || undefined,
      date: filterDate || undefined,
    })
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadOrders();
  }

  async function handleCancel(orderId: string) {
    const ok = await appConfirm('Cancel this draft order?', {
      title: 'Cancel order',
      confirmLabel: 'Cancel Order',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await cancelOrder(orderId);
      setMessage('Order cancelled');
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  return (
    <AppLayout title="Orders" subtitle={isAdmin ? 'All active POS sessions' : 'Current session'}>
      <div className="orders-page">
        <section className="page-hero">
          <h2>{isAdmin ? 'All Session Orders' : 'Session Orders'}</h2>
          <p>
            {isAdmin
              ? 'Orders from every open cashier session — search and manage across the floor'
              : 'Search, filter, and manage orders for your active POS session'}
          </p>
        </section>

        <form className="orders-search" onSubmit={handleSearch}>
          <input
            className="pill-input"
            placeholder="Search by order #, product, or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="pill-input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button type="submit" className="terminal-btn cafe-btn-outline">Search</button>
        </form>

        {loading && <p className="pos-muted">Loading orders…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        {!loading && orders.length === 0 && (
          <p className="pos-muted">
            {isAdmin
              ? 'No orders in any open session yet. Cashier orders appear here while their session is active.'
              : 'No orders in this session yet.'}
          </p>
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
                <strong className="order-amount">₹{orderGrandTotal(order).toFixed(0)}</strong>
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
