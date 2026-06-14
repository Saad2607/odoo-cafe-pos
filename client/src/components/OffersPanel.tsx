import '../styles/offers.css';

export interface OfferCoupon {
  code: string;
  discountType: string;
  discountValue: number;
  summary: string;
  howToUse: string;
}

export interface OfferPromotion {
  name: string;
  triggerType: string;
  summary: string;
  howToUse: string;
  autoApply: true;
}

interface OffersPanelProps {
  coupons: OfferCoupon[];
  promotions: OfferPromotion[];
  onApplyCoupon?: (code: string) => void;
  activeCouponCode?: string;
  compact?: boolean;
}

export default function OffersPanel({
  coupons,
  promotions,
  onApplyCoupon,
  activeCouponCode,
  compact = false,
}: OffersPanelProps) {
  if (coupons.length === 0 && promotions.length === 0) return null;

  return (
    <section className={`offers-panel${compact ? ' offers-panel--compact' : ''}`}>
      <header className="offers-panel-head">
        <span className="offers-panel-icon">🏷️</span>
        <div>
          <h4>Today&apos;s Offers</h4>
          <p>Share these with customers at checkout</p>
        </div>
      </header>

      {coupons.length > 0 && (
        <div className="offers-group">
          <p className="offers-group-label">Coupon codes</p>
          <ul className="offers-list">
            {coupons.map((c) => (
              <li key={c.code} className={`offers-coupon${activeCouponCode === c.code ? ' active' : ''}`}>
                <div className="offers-coupon-main">
                  <code className="offers-code">{c.code}</code>
                  <strong>{c.summary}</strong>
                </div>
                <p className="offers-hint">{c.howToUse}</p>
                {onApplyCoupon && (
                  <button
                    type="button"
                    className="terminal-btn cafe-btn-outline offers-apply-btn"
                    onClick={() => onApplyCoupon(c.code)}
                  >
                    {activeCouponCode === c.code ? 'Applied ✓' : 'Apply'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {promotions.length > 0 && (
        <div className="offers-group">
          <p className="offers-group-label">Auto promotions</p>
          <ul className="offers-list">
            {promotions.map((p) => (
              <li key={p.name} className="offers-promo">
                <div className="offers-promo-main">
                  <strong>{p.name}</strong>
                  <span className="offers-badge-auto">Auto</span>
                  <em>{p.summary}</em>
                </div>
                <p className="offers-hint">{p.howToUse}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
