import { useEffect, useMemo, useState } from 'react';

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



const TIP_PRESETS = [
  { id: 'none', label: 'No tip' },
  { id: '10', label: '₹10', amount: 10 },
  { id: '20', label: '₹20', amount: 20 },
  { id: '50', label: '₹50', amount: 50 },
  { id: 'custom', label: 'Other' },
] as const;



type TipPresetId = (typeof TIP_PRESETS)[number]['id'];



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

  const [tipPreset, setTipPreset] = useState<TipPresetId>('none');

  const [customTip, setCustomTip] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');



  const effectiveDiscount = couponDiscount ?? order.discount ?? 0;

  const billAmount = Math.round(order.subtotal + order.taxAmount - effectiveDiscount);



  const tipAmount = useMemo(() => {
    if (tipPreset === 'none') return 0;
    if (tipPreset === 'custom') {
      const value = parseFloat(customTip);
      return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
    }
    const preset = TIP_PRESETS.find((p) => p.id === tipPreset);
    return preset && 'amount' in preset ? preset.amount : 0;
  }, [tipPreset, customTip]);



  const totalDue = billAmount + tipAmount;



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

    ? Math.max(0, parseFloat(amountReceived) - totalDue)

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

        tipAmount,

      });

      const receiptMsg = res.receipt?.emailed

        ? `Receipt emailed to ${res.receipt.to}${res.receipt.viewUrl ? '' : ''}`

        : res.receipt?.viewUrl

          ? `Payment complete. Customer receipt: ${res.receipt.viewUrl}`

          : undefined;

      if (res.receipt?.viewUrl && res.receipt.emailed) {

        window.open(res.receipt.viewUrl, '_blank', 'noopener');

      }

      onSuccess(res.order, receiptMsg);

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Payment failed');

    } finally {

      setSubmitting(false);

    }

  }



  const received = parseFloat(amountReceived);

  const canPay = method === 'CASH'

    ? !Number.isNaN(received) && received >= totalDue

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



        <div className="payment-breakdown">

          <div className="payment-breakdown-row">

            <span>Bill</span>

            <strong>₹{billAmount}</strong>

          </div>

          {tipAmount > 0 && (

            <div className="payment-breakdown-row payment-breakdown-tip">

              <span>Tip</span>

              <strong>+₹{tipAmount}</strong>

            </div>

          )}

          <div className="payment-total">

            <span>Total due</span>

            <strong>₹{totalDue}</strong>

          </div>

        </div>



        {order.promotionName && (

          <p className="payment-promo">Promotion: {order.promotionName} (−₹{order.discount.toFixed(0)})</p>

        )}



        <div className="payment-tip-section">

          <label className="payment-tip-label">Add a tip</label>

          <div className="payment-tip-presets">

            {TIP_PRESETS.map((preset) => (

              <button

                key={preset.id}

                type="button"

                className={`payment-tip-btn${tipPreset === preset.id ? ' active' : ''}`}

                onClick={() => setTipPreset(preset.id)}

              >

                {preset.label}

              </button>

            ))}

          </div>

          {tipPreset === 'custom' && (

            <input

              type="number"

              min={0}

              step={1}

              className="pill-input payment-tip-custom"

              value={customTip}

              onChange={(e) => setCustomTip(e.target.value)}

              placeholder="Enter amount in ₹"

            />

          )}

        </div>



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

              min={totalDue}

              step={1}

              className="pill-input"

              value={amountReceived}

              onChange={(e) => setAmountReceived(e.target.value)}

              placeholder={String(totalDue)}

            />

            {received >= totalDue && changeDue > 0 && (

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

            <img

              className="payment-qr-img"

              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(

                `upi://pay?pa=${settings.upiId}&pn=Brivio&am=${totalDue}&cu=INR`,

              )}`}

              alt="UPI QR Code"

            />

            <p className="pos-muted">Amount: ₹{totalDue}</p>

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

