import { useEffect, useState } from 'react';
import {
  fetchPaymentSettings,
  payOrder,
  Order,
  PaymentSettings,
} from '../lib/api';
import '../styles/payment.css';

interface PaymentModalProps {
  order: Order;
  couponCode: string;
  couponDiscount: number | null;
  onClose: () => void;
  onSuccess: (order: Order, receiptMsg?: string) => void;
}

export default function PaymentModal({
  order,
  couponCode,
  couponDiscount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveDiscount = couponDiscount ?? order.discount ?? 0;
  const amountDue = order.subtotal + order.taxAmount - effectiveDiscount;
  const displayAmount = Math.round(amountDue);

  useEffect(() => {
    fetchPaymentSettings()
      .then((res) => {
        setSettings(res.settings);
        if (res.settings.cashEnabled) setMethod('CASH');
        else if (res.settings.upiEnabled) setMethod('UPI');
        else if (res.settings.cardEnabled) setMethod('CARD');
      })
      .catch(() => setError('Failed to load payment settings'));
  }, []);

  const changeDue = method === 'CASH' && amountReceived
    ? Math.max(0, parseFloat(amountReceived) - displayAmount)
    : 0;

  function selectMethod(next: 'CASH' | 'CARD' | 'UPI') {
    setMethod(next);
    setError('');
  }

  async function handlePay() {
    setSubmitting(true);
    setError('');
    try {
      const received = parseFloat(amountReceived);
      const res = await payOrder(order.id, {
        paymentMethod: method,
        couponCode: couponCode.trim() || undefined,
        amountReceived: method === 'CASH' ? received : undefined,
        cardReference: method === 'CARD' ? cardReference.trim() : undefined,
      });
      const receiptMsg = res.receipt?.emailed
        ? `Receipt emailed to ${res.receipt.to}`
        : undefined;
      onSuccess(res.order, receiptMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  const received = parseFloat(amountReceived);
  const canPay = method === 'CASH'
    ? !Number.isNaN(received) && received >= displayAmount
    : method === 'CARD'
      ? cardReference.trim().length > 0
      : true;

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <header className="payment-header">
          <h3>Payment</h3>
          <button type="button" className="payment-close" onClick={onClose}>×</button>
        </header>

        <div className="payment-total">
          <span>Amount due</span>
          <strong>₹{displayAmount}</strong>
        </div>

        {order.promotionName && (
          <p className="payment-promo">Promotion: {order.promotionName} (−₹{order.discount.toFixed(0)})</p>
        )}

        {settings && (
          <div className="payment-methods">
            {settings.cashEnabled && (
              <button
                type="button"
                className={`payment-method-btn${method === 'CASH' ? ' active' : ''}`}
                onClick={() => selectMethod('CASH')}
              >
                Cash
              </button>
            )}
            {settings.cardEnabled && (
              <button
                type="button"
                className={`payment-method-btn${method === 'CARD' ? ' active' : ''}`}
                onClick={() => selectMethod('CARD')}
              >
                Card
              </button>
            )}
            {settings.upiEnabled && (
              <button
                type="button"
                className={`payment-method-btn${method === 'UPI' ? ' active' : ''}`}
                onClick={() => selectMethod('UPI')}
              >
                UPI
              </button>
            )}
          </div>
        )}

        {method === 'CASH' && (
          <div className="payment-field">
            <label>Amount received</label>
            <input
              type="number"
              min={displayAmount}
              step={1}
              className="pill-input"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder={String(displayAmount)}
            />
            {received >= displayAmount && changeDue > 0 && (
              <p className="payment-change">Change: ₹{changeDue.toFixed(0)}</p>
            )}
          </div>
        )}

        {method === 'CARD' && (
          <div className="payment-field">
            <label>Card reference / last 4 digits</label>
            <input
              className="pill-input"
              value={cardReference}
              onChange={(e) => setCardReference(e.target.value)}
              placeholder="e.g. 4242"
            />
          </div>
        )}

        {method === 'UPI' && settings && (
          <div className="payment-upi">
            <p>Scan & pay to:</p>
            <strong>{settings.upiId}</strong>
            <div className="payment-qr">UPI QR</div>
            <p className="pos-muted">Confirm payment after customer pays</p>
          </div>
        )}

        {error && <div className="pos-error">{error}</div>}

        <button
          type="button"
          className="terminal-btn cafe-btn-primary payment-confirm"
          onClick={handlePay}
          disabled={submitting || !canPay}
        >
          {submitting ? 'Processing…' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}
