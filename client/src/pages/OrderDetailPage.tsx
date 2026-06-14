import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  cancelOrder,
  fetchOrder,
  fetchProducts,
  Order,
  Product,
  updateDraftOrder,
} from '../lib/api';
import { appConfirm } from '../context/DialogContext';
import '../styles/orders.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  DRAFT: 'Draft',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editItems, setEditItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    if (!orderId) return;
    setLoading(true);
    Promise.all([fetchOrder(orderId), fetchProducts()])
      .then(([o, p]) => {
        setOrder(o.order);
        setEditItems(o.order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        setProducts(p.products);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [orderId]);

  if (!orderId) return <Navigate to="/orders" replace />;

  function updateQty(productId: string, delta: number) {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const qty = existing.quantity + delta;
        if (qty <= 0) return prev.filter((i) => i.productId !== productId);
        return prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i);
      }
      if (delta > 0) return [...prev, { productId, quantity: delta }];
      return prev;
    });
  }

  async function handleSave() {
    if (!order) return;
    try {
      const res = await updateDraftOrder(order.id, editItems);
      setOrder(res.order);
      setEditing(false);
      setMessage('Order updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleCancel() {
    if (!order) return;
    const ok = await appConfirm('Cancel this draft order?', {
      title: 'Cancel order',
      confirmLabel: 'Cancel Order',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await cancelOrder(order.id);
      navigate('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    }
  }

  return (
    <AppLayout title="Order Detail" subtitle={order?.orderNumber ?? ''}>
      <div className="orders-page order-detail-page">
        <Link to="/orders" className="cafe-back-link">← Back to Orders</Link>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        {order && !loading && (
          <article className={`order-card status-${order.status.toLowerCase()}`}>
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
              <span>{new Date(order.date).toLocaleString()}</span>
              {order.kitchenStatus !== 'NONE' && <span>Kitchen: {order.kitchenStatus}</span>}
            </div>

            {order.status === 'PAID' && (
              <div className="order-detail-totals">
                <p>Subtotal: ₹{order.subtotal.toFixed(0)}</p>
                <p>Tax: ₹{order.taxAmount.toFixed(0)}</p>
                {order.discount > 0 && <p>Discount: −₹{order.discount.toFixed(0)}</p>}
                {order.couponCode && <p>Coupon: {order.couponCode}</p>}
                {order.promotionName && <p>Promotion: {order.promotionName}</p>}
                {order.changeDue != null && order.changeDue > 0 && (
                  <p>Change: ₹{order.changeDue.toFixed(0)}</p>
                )}
              </div>
            )}

            <h4>Items</h4>
            {editing ? (
              <div className="order-edit-grid">
                {products.map((p) => {
                  const item = editItems.find((i) => i.productId === p.id);
                  const qty = item?.quantity ?? 0;
                  return (
                    <div key={p.id} className="order-edit-row">
                      <span>{p.name} · ₹{p.price}</span>
                      <div className="order-edit-qty">
                        <button type="button" onClick={() => updateQty(p.id, -1)}>−</button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => updateQty(p.id, 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="order-card-items">
                {order.items.map((item) => (
                  <li key={item.id ?? item.productId}>
                    {item.productName} ×{item.quantity} — ₹{item.lineTotal.toFixed(0)}
                  </li>
                ))}
              </ul>
            )}

            <div className="order-card-actions">
              {order.status === 'DRAFT' && !editing && (
                <>
                  {order.table && (
                    <Link to={`/order/${order.table.id}`} className="terminal-btn cafe-btn-outline">
                      Edit Order
                    </Link>
                  )}
                  {order.table && (
                    <Link to={`/order/${order.table.id}`} className="terminal-btn cafe-btn-primary">
                      Go to Pay
                    </Link>
                  )}
                  <button type="button" className="terminal-btn cafe-btn-danger" onClick={handleCancel}>
                    Delete Order
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button type="button" className="terminal-btn cafe-btn-primary" onClick={handleSave}>
                    Save Changes
                  </button>
                  <button type="button" className="terminal-btn cafe-btn-outline"
                    onClick={() => { setEditing(false); load(); }}>
                    Cancel Edit
                  </button>
                </>
              )}
            </div>
          </article>
        )}
      </div>
    </AppLayout>
  );
}
