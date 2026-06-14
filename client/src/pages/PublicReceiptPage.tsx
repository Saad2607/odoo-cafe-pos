import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicReceipt, orderGrandTotal } from '../lib/api';
import '../styles/receipt-public.css';

export default function PublicReceiptPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<Awaited<ReturnType<typeof fetchPublicReceipt>>['order'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchPublicReceipt(token)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err instanceof Error ? err.message : 'Receipt not found'));
  }, [token]);

  if (error) {
    return (
      <div className="receipt-public-page">
        <div className="receipt-public-card">
          <h1>Brivio</h1>
          <p className="pos-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="receipt-public-page">
        <div className="receipt-public-card"><p>Loading receipt…</p></div>
      </div>
    );
  }

  return (
    <div className="receipt-public-page">
      <article className="receipt-public-card">
        <header className="receipt-public-head">
          <h1>BRIVIO</h1>
          <p>Your receipt</p>
        </header>
        <div className="receipt-public-meta">
          <p><strong>Order:</strong> {order.orderNumber}</p>
          <p><strong>Date:</strong> {new Date(order.date).toLocaleString()}</p>
          {order.table && <p><strong>Table:</strong> {order.table.tableNumber}</p>}
          {order.customer && <p><strong>Customer:</strong> {order.customer.name}</p>}
        </div>
        <table className="receipt-public-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id ?? item.productId}>
                <td>
                  {item.productName}
                  {item.discount > 0 && <span className="receipt-line-promo"> −₹{item.discount} promo</span>}
                </td>
                <td>{item.quantity}</td>
                <td>₹{item.unitPrice}</td>
                <td>₹{item.lineTotal.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="receipt-public-totals">
          <p>Subtotal: ₹{order.subtotal.toFixed(0)}</p>
          <p>Tax: ₹{order.taxAmount.toFixed(0)}</p>
          {order.discount > 0 && <p className="receipt-discount">Discount: −₹{order.discount.toFixed(0)}</p>}
          {order.couponCode && <p>Coupon: {order.couponCode}</p>}
          {order.promotionName && <p>Promotion: {order.promotionName}</p>}
          {(order.tipAmount ?? 0) > 0 && <p>Tip: ₹{(order.tipAmount ?? 0).toFixed(0)}</p>}
          <p className="receipt-grand-total">Total: ₹{orderGrandTotal(order).toFixed(0)}</p>
          {order.paymentMethod && <p>Paid via: {order.paymentMethod}</p>}
        </div>
        <footer className="receipt-public-footer">Thank you for visiting Brivio Cafe!</footer>
        <button type="button" className="terminal-btn cafe-btn-outline" onClick={() => window.print()}>
          Print Receipt
        </button>
      </article>
    </div>
  );
}
