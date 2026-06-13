import { Order } from '../lib/api';
import '../styles/receipt.css';

interface ReceiptPrintProps {
  order: Order;
  onClose: () => void;
}

export default function ReceiptPrint({ order, onClose }: ReceiptPrintProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="receipt-overlay no-print-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-print-area" id="receipt-print">
          <header className="receipt-header">
            <h2>BRIVIO</h2>
            <p>Odoo Cafe POS</p>
            <p>{new Date(order.date).toLocaleString()}</p>
          </header>

          <div className="receipt-meta">
            <p><strong>{order.orderNumber}</strong></p>
            {order.table && <p>Table {order.table.tableNumber}</p>}
            {order.customer && <p>{order.customer.name}</p>}
            {order.paymentMethod && <p>Paid via {order.paymentMethod}</p>}
          </div>

          <table className="receipt-items">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Total</th></tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id ?? item.productId}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.lineTotal.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-totals">
            <p>Subtotal: ₹{order.subtotal.toFixed(0)}</p>
            <p>Tax: ₹{order.taxAmount.toFixed(0)}</p>
            {order.discount > 0 && <p>Discount: −₹{order.discount.toFixed(0)}</p>}
            {order.couponCode && <p>Coupon: {order.couponCode}</p>}
            {order.promotionName && <p>Promo: {order.promotionName}</p>}
            <p className="receipt-grand"><strong>Total: ₹{order.amount.toFixed(0)}</strong></p>
            {order.amountReceived != null && (
              <p>Received: ₹{order.amountReceived.toFixed(0)}</p>
            )}
            {order.changeDue != null && order.changeDue > 0 && (
              <p>Change: ₹{order.changeDue.toFixed(0)}</p>
            )}
          </div>

          <footer className="receipt-footer">
            <p>Thank you for visiting Brivio!</p>
            <p>Eat breakfast. Be nice to people.</p>
          </footer>
        </div>

        <div className="receipt-actions no-print">
          <button type="button" className="terminal-btn cafe-btn-primary" onClick={handlePrint}>
            Print Receipt
          </button>
          <button type="button" className="terminal-btn cafe-btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
