import { useState } from 'react';
import OffersPanel from './OffersPanel';
import type { OfferCoupon, OfferPromotion } from '../lib/api';
import '../styles/payment.css';

interface DiscountModalProps {
  couponCode: string;
  coupons?: OfferCoupon[];
  promotions?: OfferPromotion[];
  onApply: (code: string) => void;
  onClose: () => void;
}

export default function DiscountModal({
  couponCode,
  coupons = [],
  promotions = [],
  onApply,
  onClose,
}: DiscountModalProps) {
  const [code, setCode] = useState(couponCode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(code.trim());
    onClose();
  }

  return (
    <div
      className="payment-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        className="payment-modal discount-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="payment-header">
          <h3>Apply Coupon</h3>
          <button type="button" className="payment-close" onClick={onClose}>×</button>
        </header>
        <p className="pos-muted">Pick an offer below or enter a coupon code manually.</p>
        {(coupons.length > 0 || promotions.length > 0) && (
          <OffersPanel
            coupons={coupons}
            promotions={promotions}
            activeCouponCode={couponCode || undefined}
            onApplyCoupon={(code) => {
              onApply(code);
              onClose();
            }}
          />
        )}
        <input
          className="pill-input"
          placeholder="e.g. WELCOME10"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoFocus
          required
        />
        <button type="submit" className="terminal-btn cafe-btn-primary payment-confirm">Apply Coupon</button>
      </form>
    </div>
  );
}
