import { useEffect, useMemo, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../components/AppLayout';

import FoodCard from '../components/FoodCard';

import PaymentModal from '../components/PaymentModal';
import ReceiptPrint from '../components/ReceiptPrint';
import DiscountModal from '../components/DiscountModal';
import ReceiptEmailModal from '../components/ReceiptEmailModal';

import { getFoodImage } from '../lib/foodImages';

import {

  assignOrderCustomer,

  createCustomer,

  createOrder,
  updateDraftOrder,
  setCurrentTable,

  fetchCustomers,

  fetchProducts,

  fetchTableOrder,

  validateCoupon,

  Product,

  Order,

  Customer,

} from '../lib/api';

import '../styles/pos.css';

import '../styles/cafe-menu.css';



const VEG_ITEMS = new Set([

  'Pesto Eggs on Toast', 'Beetroot Avocado Toast', 'Veg Ragout & Herb Labneh',

  'Tropical Smoothie Bowl', 'Cocoa Raspberry Smoothie Bowl', 'Granola Bowl',

  'Honey Butter French Toast', 'Ricotta Pancakes',

]);



interface CartLine { product: Product; quantity: number; }



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

  const [search, setSearch] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showReceiptEmail, setShowReceiptEmail] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);



  useEffect(() => {

    if (!tableId) return;

    Promise.all([fetchProducts(), fetchTableOrder(tableId)])

      .then(([productRes, orderRes]) => {

        setProducts(productRes.products);

        setExistingOrder(orderRes.order);

        if (orderRes.order?.customer) {

          setSelectedCustomer(orderRes.order.customer);

        }

        if (orderRes.order?.table) {
          setCurrentTable(orderRes.order.table.tableNumber);
        }

        if (orderRes.order?.status === 'DRAFT') {
          const lines: CartLine[] = [];
          for (const item of orderRes.order.items) {
            const product = productRes.products.find((p) => p.id === item.productId);
            if (product) lines.push({ product, quantity: item.quantity });
          }
          if (lines.length) setCart(lines);
        }

      })

      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load menu'))

      .finally(() => setLoading(false));

  }, [tableId]);



  const categories = useMemo(() => {

    const map = new Map<string, { id: string; name: string; color: string }>();

    for (const p of products) {

      if (p.category) map.set(p.category.id, p.category);

    }

    return Array.from(map.values());

  }, [products]);



  const filteredProducts = useMemo(() => {

    const q = search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((p) =>

      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),

    );

  }, [products, search]);



  const total = cart.reduce((sum, line) => {

    const lineTotal = line.product.price * line.quantity;

    return sum + lineTotal + lineTotal * (line.product.tax / 100);

  }, 0);



  function addToCart(product: Product) {

    setCart((prev) => {

      const existing = prev.find((l) => l.product.id === product.id);

      if (existing) {

        return prev.map((l) => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l);

      }

      return [...prev, { product, quantity: 1 }];

    });

  }



  function changeQty(productId: string, delta: number) {

    setCart((prev) =>

      prev.map((l) => l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l)

        .filter((l) => l.quantity > 0),

    );

  }



  async function handleSubmit() {

    if (!tableId || !cart.length) return;

    setSubmitting(true);

    setError('');

    try {

      if (existingOrder?.status === 'DRAFT') {
        const res = await updateDraftOrder(
          existingOrder.id,
          cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        );
        setExistingOrder(res.order);
        setMessage(res.order.promotionName
          ? `Order updated — ${res.order.promotionName} applied (−₹${res.order.discount})`
          : 'Order updated and sent to kitchen.');
      } else {
        const res = await createOrder(
          tableId,
          cart.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          selectedCustomer?.id,
        );
        setExistingOrder(res.order);
        setCart([]);
        setMessage(res.order.promotionName
          ? `Order sent — ${res.order.promotionName} applied (−₹${res.order.discount})`
          : 'Order sent to kitchen.');
      }

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to save order');

    } finally {

      setSubmitting(false);

    }

  }



  async function handleApplyCouponWithCode(code: string) {

    if (!existingOrder || !code.trim()) return;

    try {

      const res = await validateCoupon(code.trim(), existingOrder.subtotal, existingOrder.taxAmount);

      setCouponDiscount(res.discount);

      setCouponCode(code.trim());

      setMessage(`Coupon ${res.code} applied — ₹${res.discount.toFixed(0)} off`);

    } catch (err) {

      setCouponDiscount(null);

      setError(err instanceof Error ? err.message : 'Invalid coupon');

    }

  }



  async function searchCustomers(q: string) {

    setCustomerSearch(q);

    if (q.length < 2) { setCustomers([]); return; }

    const res = await fetchCustomers(q);

    setCustomers(res.customers);

  }



  async function assignCustomer(customer: Customer) {

    if (!existingOrder) {

      setSelectedCustomer(customer);

      setShowCustomerPicker(false);

      return;

    }

    try {

      const res = await assignOrderCustomer(existingOrder.id, customer.id);

      setExistingOrder(res.order);

      setSelectedCustomer(customer);

      setShowCustomerPicker(false);

      setMessage(`Customer ${customer.name} assigned`);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to assign customer');

    }

  }



  async function quickCreateCustomer() {

    if (!customerSearch.trim()) return;

    try {

      const res = await createCustomer({ name: customerSearch.trim() });

      await assignCustomer(res.customer);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to create customer');

    }

  }



  function handlePaymentSuccess(order: Order, receiptMsg?: string) {

    setShowPayment(false);

    setExistingOrder(order);

    setReceiptOrder(order);

    setMessage(receiptMsg || 'Payment complete.');

  }



  return (

    <AppLayout title="Breakfast Menu" subtitle="Savoury & Sweet">

      <div className="pos-page order-page cafe-order-page">

        <Link to="/floor" className="cafe-back-link">← Back to Floor Plan</Link>



        <header className="cafe-order-header">

          <h2>BRIVIO</h2>

          <p>FROM 8:00 TO 11.30AM</p>

        </header>



        <div className="order-toolbar">

          <input

            className="pill-input order-search"

            placeholder="Search products…"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

          <button

            type="button"

            className="terminal-btn cafe-btn-outline"

            onClick={() => setShowCustomerPicker(!showCustomerPicker)}

          >

            {selectedCustomer ? selectedCustomer.name : 'Assign Customer'}

          </button>

        </div>



        {showCustomerPicker && (

          <div className="customer-picker">

            <input

              className="pill-input"

              placeholder="Search or type new name…"

              value={customerSearch}

              onChange={(e) => searchCustomers(e.target.value)}

            />

            {customers.map((c) => (

              <button key={c.id} type="button" className="customer-pick-btn" onClick={() => assignCustomer(c)}>

                {c.name} {c.email && <span className="pos-muted">{c.email}</span>}

              </button>

            ))}

            {customerSearch.trim().length >= 2 && (

              <button type="button" className="terminal-btn cafe-btn-outline" onClick={quickCreateCustomer}>

                Create "{customerSearch.trim()}"

              </button>

            )}

          </div>

        )}



        {loading && <p className="pos-muted">Loading menu…</p>}

        {error && <div className="pos-error">{error}</div>}

        {message && <div className="pos-success">{message}</div>}



        {!loading && (

          <div className="order-layout">

            <section className="menu-panel cafe-menu-panel">

              {categories.map((cat, ci) => {

                const catProducts = filteredProducts.filter((p) => p.category?.id === cat.id);

                if (!catProducts.length) return null;

                return (

                  <div key={cat.id} className="menu-category cafe-category" style={{ animationDelay: `${ci * 0.1}s`, borderColor: cat.color }}>
                    <h3 style={{ color: cat.color }}>{cat.name}</h3>

                    <div className="product-grid cafe-food-grid">

                      {catProducts.map((product) => (

                        <FoodCard

                          key={product.id}

                          name={product.name}

                          description={product.description}

                          price={product.price}

                          tax={product.tax}

                          imageUrl={product.imageUrl}

                          accent={cat.color}

                          vegetarian={VEG_ITEMS.has(product.name)}

                          disabled={existingOrder?.status === 'PAID'}

                          onAdd={() => addToCart(product)}

                        />

                      ))}

                    </div>

                  </div>

                );

              })}

            </section>



            <aside className="cart-panel cafe-cart">

              <h3>Your Order</h3>

              {existingOrder?.status === 'PAID' ? (

                <>

                  <p className="pos-muted">#{existingOrder.orderNumber} — Paid</p>

                  <ul className="cart-list">

                    {existingOrder.items.map((item) => (

                      <li key={item.productId}>

                        <strong>{item.productName}</strong> ×{item.quantity}

                      </li>

                    ))}

                  </ul>

                  <div className="cart-total cafe-total"><span>Total</span><strong>₹{existingOrder.amount.toFixed(0)}</strong></div>

                </>

              ) : (

                <>

                  {existingOrder && <p className="pos-muted">#{existingOrder.orderNumber}</p>}

                  {existingOrder?.promotionName && (

                    <p className="pos-muted promo-line">{existingOrder.promotionName}: −₹{existingOrder.discount}</p>

                  )}

                  {cart.length === 0 && <p className="pos-muted">Select items from the menu</p>}

                  <ul className="cart-list">

                    {cart.map((line) => (

                      <li key={line.product.id}>

                        <img src={getFoodImage(line.product.name, line.product.imageUrl)} alt="" className="cart-food-photo" />

                        <div className="cart-item-details">

                          <strong>{line.product.name}</strong>

                          <div className="qty-controls">

                            <button type="button" onClick={() => changeQty(line.product.id, -1)}>−</button>

                            <span>{line.quantity}</span>

                            <button type="button" onClick={() => changeQty(line.product.id, 1)}>+</button>

                          </div>

                        </div>

                        <span>₹{(line.product.price * line.quantity).toFixed(0)}</span>

                      </li>

                    ))}

                  </ul>

                  {cart.length > 0 && (

                    <>

                      <div className="cart-total cafe-total">

                        <span>Total</span>

                        <strong>

                          ₹{existingOrder

                            ? (couponDiscount != null

                              ? (existingOrder.subtotal + existingOrder.taxAmount - couponDiscount).toFixed(0)

                              : existingOrder.amount.toFixed(0))

                            : total.toFixed(0)}

                        </strong>

                      </div>

                      {existingOrder && (
                        <button type="button" className="terminal-btn cafe-btn-outline cart-action-btn"
                          onClick={() => setShowDiscount(true)}>
                          Discount / Coupon
                        </button>
                      )}

                      {existingOrder && (

                        <button type="button" className="terminal-btn cafe-btn-outline cart-action-btn"

                          onClick={() => setShowReceiptEmail(true)}>

                          Send Receipt

                        </button>

                      )}

                      {!existingOrder && (

                        <button type="button" className="terminal-btn cafe-btn-primary cart-submit" onClick={handleSubmit} disabled={submitting}>

                          {submitting ? 'Sending…' : 'Send to Kitchen'}

                        </button>

                      )}

                      {existingOrder?.status === 'DRAFT' && (

                        <>

                          <button type="button" className="terminal-btn cafe-btn-primary cart-submit" onClick={handleSubmit} disabled={submitting}>

                            {submitting ? 'Updating…' : 'Update Order'}

                          </button>

                          <button type="button" className="terminal-btn cafe-btn-primary cart-submit" onClick={() => setShowPayment(true)}>

                            Pay & Close Table

                          </button>

                        </>

                      )}

                    </>

                  )}

                </>

              )}

            </aside>

          </div>

        )}



        {showPayment && existingOrder && (

          <PaymentModal

            order={existingOrder}

            couponCode={couponCode}

            couponDiscount={couponDiscount}

            onClose={() => setShowPayment(false)}

            onSuccess={handlePaymentSuccess}

          />

        )}

        {receiptOrder && (
          <ReceiptPrint
            order={receiptOrder}
            onClose={() => {
              setReceiptOrder(null);
              navigate('/floor');
            }}
          />
        )}

        {showDiscount && (
          <DiscountModal
            couponCode={couponCode}
            onApply={(code) => { setCouponCode(code); handleApplyCouponWithCode(code); }}
            onClose={() => setShowDiscount(false)}
          />
        )}

        {showReceiptEmail && existingOrder && (
          <ReceiptEmailModal
            orderId={existingOrder.id}
            defaultEmail={selectedCustomer?.email ?? undefined}
            onClose={() => setShowReceiptEmail(false)}
          />
        )}

      </div>

    </AppLayout>

  );

}

