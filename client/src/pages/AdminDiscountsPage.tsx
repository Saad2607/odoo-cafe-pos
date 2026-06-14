import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Coupon,
  Promotion,
  createCoupon,
  createPromotion,
  deleteCoupon,
  deletePromotion,
  fetchAdminCoupons,
  fetchAdminPromotions,
  fetchAllProducts,
  getStoredUser,
  Product,
  updateCoupon,
} from '../lib/api';
import '../styles/pos.css';

const emptyCoupon = {
  code: '',
  discountType: 'PERCENTAGE' as Coupon['discountType'],
  discountValue: '',
  isActive: true,
};

const emptyPromo = {
  name: '',
  triggerType: 'ORDER' as Promotion['triggerType'],
  minQuantity: '',
  minOrderAmount: '',
  discountType: 'PERCENTAGE' as Promotion['discountType'],
  discountValue: '',
  productId: '',
  isActive: true,
};

export default function AdminDiscountsPage() {
  const user = getStoredUser();
  const [tab, setTab] = useState<'coupons' | 'promotions'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    Promise.all([fetchAdminCoupons(), fetchAdminPromotions(), fetchAllProducts()])
      .then(([c, p, prod]) => {
        setCoupons(c.coupons);
        setPromotions(p.promotions);
        setProducts(prod.products);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  async function handleCouponSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      code: couponForm.code.toUpperCase(),
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      isActive: couponForm.isActive,
    };
    try {
      if (editingCouponId) {
        await updateCoupon(editingCouponId, payload);
        setMessage('Coupon updated');
      } else {
        await createCoupon(payload);
        setMessage('Coupon created');
      }
      setCouponForm(emptyCoupon);
      setEditingCouponId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handlePromoSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload: Record<string, unknown> = {
      name: promoForm.name,
      triggerType: promoForm.triggerType,
      discountType: promoForm.discountType,
      discountValue: Number(promoForm.discountValue),
      isActive: promoForm.isActive,
    };
    if (promoForm.triggerType === 'PRODUCT') {
      payload.minQuantity = Number(promoForm.minQuantity) || 1;
      payload.productId = promoForm.productId;
    } else {
      payload.minOrderAmount = Number(promoForm.minOrderAmount) || 0;
    }
    try {
      await createPromotion(payload);
      setPromoForm(emptyPromo);
      setMessage('Promotion created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  function startEditCoupon(c: Coupon) {
    setEditingCouponId(c.id);
    setCouponForm({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      isActive: c.isActive,
    });
  }

  return (
    <AppLayout title="Discounts" subtitle="Coupons & promotions">
      <div className="pos-page admin-page">
        <section className="page-hero">
          <h2>Discounts & Coupons</h2>
          <p>Create promo codes and percentage or fixed discounts</p>
        </section>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="discount-tabs">
          <button type="button" className={`discount-tab${tab === 'coupons' ? ' active' : ''}`}
            onClick={() => setTab('coupons')}>Coupons</button>
          <button type="button" className={`discount-tab${tab === 'promotions' ? ' active' : ''}`}
            onClick={() => setTab('promotions')}>Promotions</button>
        </div>

        {tab === 'coupons' && (
          <div className="admin-layout">
            <form className="admin-form" onSubmit={handleCouponSubmit}>
              <h3>{editingCouponId ? 'Edit Coupon' : 'Add Coupon'}</h3>
              <input className="pill-input" placeholder="Code" value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required />
              <select className="pill-input" value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as Coupon['discountType'] })}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
              <input className="pill-input" type="number" step="0.01" placeholder="Value"
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required />
              <label className="admin-check">
                <input type="checkbox" checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })} />
                Active
              </label>
              <button type="submit" className="terminal-btn cafe-btn-primary">
                {editingCouponId ? 'Update' : 'Create'}
              </button>
              {editingCouponId && (
                <button type="button" className="terminal-btn cafe-btn-outline"
                  onClick={() => { setEditingCouponId(null); setCouponForm(emptyCoupon); }}>
                  Cancel edit
                </button>
              )}
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Code</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.code}</strong></td>
                      <td>{c.discountType}</td>
                      <td>{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                      <td>{c.isActive ? 'Active' : 'Inactive'}</td>
                      <td className="admin-actions">
                        <button type="button" className="terminal-btn cafe-btn-outline"
                          onClick={() => startEditCoupon(c)}>Edit</button>
                        <button type="button" className="terminal-btn cafe-btn-danger"
                          onClick={async () => { await deleteCoupon(c.id); load(); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'promotions' && (
          <div className="admin-layout">
            <form className="admin-form" onSubmit={handlePromoSubmit}>
              <h3>Add Promotion</h3>
              <input className="pill-input" placeholder="Name" value={promoForm.name}
                onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} required />
              <select className="pill-input" value={promoForm.triggerType}
                onChange={(e) => setPromoForm({ ...promoForm, triggerType: e.target.value as Promotion['triggerType'] })}>
                <option value="ORDER">Order total</option>
                <option value="PRODUCT">Product quantity</option>
              </select>
              {promoForm.triggerType === 'ORDER' ? (
                <input className="pill-input" type="number" placeholder="Min order amount (₹)"
                  value={promoForm.minOrderAmount}
                  onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })} />
              ) : (
                <>
                  <select className="pill-input" value={promoForm.productId}
                    onChange={(e) => setPromoForm({ ...promoForm, productId: e.target.value })} required>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="pill-input" type="number" placeholder="Min quantity"
                    value={promoForm.minQuantity}
                    onChange={(e) => setPromoForm({ ...promoForm, minQuantity: e.target.value })} />
                </>
              )}
              <select className="pill-input" value={promoForm.discountType}
                onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as Promotion['discountType'] })}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
              <input className="pill-input" type="number" step="0.01" placeholder="Discount value"
                value={promoForm.discountValue}
                onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })} required />
              <button type="submit" className="terminal-btn cafe-btn-primary">Create Promotion</button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Name</th><th>Trigger</th><th>Discount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>
                        {p.triggerType === 'ORDER'
                          ? `Order ≥ ₹${p.minOrderAmount ?? 0}`
                          : `${p.productName ?? 'Product'} ×${p.minQuantity ?? 1}`}
                      </td>
                      <td>{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `₹${p.discountValue}`}</td>
                      <td>{p.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button type="button" className="terminal-btn cafe-btn-danger"
                          onClick={async () => { await deletePromotion(p.id); load(); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
