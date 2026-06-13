import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TerminalLayout from '../components/TerminalLayout';
import {
  createOrder,
  fetchProducts,
  fetchTableOrder,
  payOrder,
  validateCoupon,
  Product,
  Order,
} from '../lib/api';
import '../styles/pos.css';

interface CartLine {
  product: Product;
  quantity: number;
}

export default function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);

  useEffect(() => {
    if (!tableId) return;

    Promise.all([fetchProducts(), fetchTableOrder(tableId)])
      .then(([productRes, orderRes]) => {
        setProducts(productRes.products);
        setExistingOrder(orderRes.order);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order view'))
      .finally(() => setLoading(false));
  }, [tableId]);

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string }>();
    for (const p of products) {
      if (p.category) map.set(p.category.id, p.category);
    }
    return Array.from(map.values());
  }, [products]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const tax = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity * (line.product.tax / 100),
    0,
  );
  const total = subtotal + tax;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function handleSubmit() {
    if (!tableId || !cart.length) return;
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await createOrder(
        tableId,
        cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      );
      setExistingOrder(res.order);
      setCart([]);
      setMessage('Order sent to kitchen!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApplyCoupon() {
    if (!existingOrder || !couponCode.trim()) return;
    setError('');
    try {
      const res = await validateCoupon(
        couponCode.trim(),
        existingOrder.subtotal,
        existingOrder.taxAmount,
      );
      setCouponDiscount(res.discount);
      setMessage(`Coupon ${res.code} applied — ₹${res.discount.toFixed(2)} off`);
    } catch (err) {
      setCouponDiscount(null);
      setError(err instanceof Error ? err.message : 'Invalid coupon');
    }
  }

  async function handlePay() {
    if (!existingOrder) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await payOrder(
        existingOrder.id,
        couponCode.trim() || undefined,
      );
      setExistingOrder(res.order);
      setMessage('Payment complete — table is free.');
      setTimeout(() => navigate('/floor'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TerminalLayout title="Order View" subtitle={tableId ? `Table order` : 'POS'}>
      <div className="pos-page order-page">
        <div className="order-toolbar">
          <Link to="/floor" className="pos-link">← Back to Floor Plan</Link>
        </div>

        {loading && <p className="pos-muted">Loading menu…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        {!loading && (
          <div className="order-layout">
            <section className="menu-panel">
              {categories.map((cat) => (
                <div key={cat.id} className="menu-category">
                  <h3 style={{ borderColor: cat.color }}>{cat.name}</h3>
                  <div className="product-grid">
                    {products
                      .filter((p) => p.category?.id === cat.id)
                      .map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="product-card"
                          onClick={() => addToCart(product)}
                          disabled={!!existingOrder}
                        >
                          <span className="product-name">{product.name}</span>
                          <span className="product-price">₹{product.price.toFixed(2)}</span>
                          <span className="product-tax">{product.tax}% tax</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </section>

            <aside className="cart-panel">
              <h3>Current Order</h3>
              {existingOrder ? (
                <>
                  <p className="pos-muted">#{existingOrder.orderNumber}</p>
                  <ul className="cart-list">
                    {existingOrder.items.map((item) => (
                      <li key={item.productId}>
                        <span>{item.productName} × {item.quantity}</span>
                        <span>₹{item.lineTotal.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="cart-total">
                    <span>Total</span>
                    <strong>
                      ₹{couponDiscount != null
                        ? (existingOrder.subtotal + existingOrder.taxAmount - couponDiscount).toFixed(2)
                        : existingOrder.amount.toFixed(2)}
                    </strong>
                  </div>
                  {couponDiscount != null && (
                    <p className="pos-muted">Discount: −₹{couponDiscount.toFixed(2)}</p>
                  )}
                  <p className="kitchen-pill">Kitchen: {existingOrder.kitchenStatus}</p>
                  {existingOrder.status === 'DRAFT' && (
                    <>
                      <div className="coupon-row">
                        <input
                          className="pill-input"
                          placeholder="Coupon (e.g. WELCOME10)"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value); setCouponDiscount(null); }}
                        />
                        <button type="button" className="terminal-btn terminal-btn-secondary"
                          onClick={handleApplyCoupon}>Apply</button>
                      </div>
                      <button
                      type="button"
                      className="terminal-btn terminal-btn-primary cart-submit"
                      onClick={handlePay}
                      disabled={submitting}
                    >
                      {submitting ? 'Processing…' : 'Pay & Close Table'}
                    </button>
                    </>
                  )}
                  {existingOrder.status === 'PAID' && (
                    <p className="pos-success">Paid — table released</p>
                  )}
                </>
              ) : (
                <>
                  {cart.length === 0 && <p className="pos-muted">Tap products to add items</p>}
                  <ul className="cart-list">
                    {cart.map((line) => (
                      <li key={line.product.id}>
                        <div>
                          <span>{line.product.name}</span>
                          <div className="qty-controls">
                            <button type="button" onClick={() => changeQty(line.product.id, -1)}>−</button>
                            <span>{line.quantity}</span>
                            <button type="button" onClick={() => changeQty(line.product.id, 1)}>+</button>
                          </div>
                        </div>
                        <span>₹{(line.product.price * line.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  {cart.length > 0 && (
                    <>
                      <div className="cart-total">
                        <span>Total</span>
                        <strong>₹{total.toFixed(2)}</strong>
                      </div>
                      <button
                        type="button"
                        className="terminal-btn terminal-btn-primary cart-submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? 'Sending…' : 'Send to Kitchen'}
                      </button>
                    </>
                  )}
                </>
              )}
            </aside>
          </div>
        )}
      </div>
    </TerminalLayout>
  );
}
