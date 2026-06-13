import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PosSessionCard from '../components/PosSessionCard';
import { fetchReports, fetchProductStats, fetchSessionStats, getStoredUser, ProductStats } from '../lib/api';
import '../styles/menu-explorer.css';
import { markFloorPopupForSession } from '../components/FloorPopup';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    sessionNumber: '',
    openedAt: '',
    paidOrderCount: 0,
    totalSales: 0,
    orderCount: 0,
    lastClosingSale: null as number | null,
  });
  const [reports, setReports] = useState<Awaited<ReturnType<typeof fetchReports>> | null>(null);
  const [catalog, setCatalog] = useState<ProductStats | null>(null);

  useEffect(() => {
    fetchSessionStats()
      .then((res) => {
        setStats({
          sessionNumber: res.session.sessionNumber,
          openedAt: res.session.openedAt,
          paidOrderCount: res.session.paidOrderCount ?? 0,
          totalSales: res.session.totalSales ?? 0,
          orderCount: res.session.orderCount ?? 0,
          lastClosingSale: res.session.lastClosingSale,
        });
      })
      .catch(() => undefined);

    fetchReports({ period: 'today' })
      .then(setReports)
      .catch(() => undefined);

    fetchProductStats()
      .then(setCatalog)
      .catch(() => undefined);
  }, []);

  const avgOrder = stats.paidOrderCount > 0
    ? Math.round(stats.totalSales / stats.paidOrderCount)
    : 0;

  const maxRevenue = Math.max(...(reports?.salesTrend.map((d) => d.revenue) ?? [1]), 1);

  function enterPos() {
    markFloorPopupForSession();
    navigate('/floor');
  }

  return (
    <AppLayout title="Dashboard" subtitle="Brivio Cafe · Reports & Session">
      <div className="dashboard-page">
        <PosSessionCard
          sessionNumber={stats.sessionNumber}
          openedAt={stats.openedAt}
          lastClosingSale={stats.lastClosingSale}
          totalSales={stats.totalSales}
          orderCount={stats.orderCount}
          onOpenSession={enterPos}
        />

        {catalog && catalog.totalProducts >= 100 && (
          <section className="dash-catalog-banner">
            <div>
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem' }}>Mega Menu Catalog</h2>
              <p>Explore {catalog.totalProducts} items across {catalog.totalCategories} categories — unique to Brivio POS</p>
            </div>
            <div className="dash-catalog-stats">
              <span><strong>{catalog.bestsellers}</strong>Bestsellers</span>
              <span><strong>{catalog.vegItems}</strong>Veg</span>
              <span><strong>{catalog.newItems}</strong>New</span>
            </div>
            <Link to="/menu-explorer" className="terminal-btn cafe-btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>
              Open Menu Explorer →
            </Link>
          </section>
        )}

        <section className="dash-metrics">
          <article className="dash-metric">
            <span className="dash-metric-icon">📋</span>
            <div>
              <strong>{stats.orderCount}</strong>
              <span>Total Orders</span>
            </div>
          </article>
          <article className="dash-metric dash-metric-main">
            <span className="dash-metric-icon">₹</span>
            <div>
              <strong>{stats.totalSales.toFixed(0)}</strong>
              <span>Revenue</span>
            </div>
          </article>
          <article className="dash-metric">
            <span className="dash-metric-icon">✓</span>
            <div>
              <strong>{stats.paidOrderCount}</strong>
              <span>Paid Orders</span>
            </div>
          </article>
          <article className="dash-metric">
            <span className="dash-metric-icon">◎</span>
            <div>
              <strong>{avgOrder > 0 ? `₹${avgOrder}` : '—'}</strong>
              <span>Avg. Order Value</span>
            </div>
          </article>
        </section>

        {reports && (
          <section className="dash-reports-section">
            <div className="dash-reports-head">
              <h2>Today&apos;s Insights</h2>
              <Link to="/reports" className="terminal-btn cafe-btn-outline">Full Reports →</Link>
            </div>
            <div className="dash-reports-grid">
              <article className="dash-report-panel">
                <h3>Sales Trend</h3>
                {reports.salesTrend.length === 0 && <p className="pos-muted">No sales yet today.</p>}
                {reports.salesTrend.map((d) => (
                  <div key={d.date} className="dash-bar-row">
                    <span>{d.date.slice(5)}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} /></div>
                    <span>₹{d.revenue}</span>
                  </div>
                ))}
              </article>
              <article className="dash-report-panel">
                <h3>Top Categories</h3>
                {reports.topCategories.slice(0, 5).map((c) => (
                  <div key={c.name} className="dash-bar-row">
                    <span>{c.name}</span>
                    <div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: `${(c.revenue / Math.max(...reports.topCategories.map((x) => x.revenue), 1)) * 100}%` }} /></div>
                    <span>₹{c.revenue}</span>
                  </div>
                ))}
              </article>
              <article className="dash-report-panel">
                <h3>Top Orders</h3>
                <table className="dash-mini-table">
                  <tbody>
                    {reports.topOrders.slice(0, 5).map((o) => (
                      <tr key={o.orderNumber}>
                        <td>{o.orderNumber}</td>
                        <td>₹{o.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
              <article className="dash-report-panel">
                <h3>Top Products</h3>
                <table className="dash-mini-table">
                  <tbody>
                    {reports.topProducts.slice(0, 5).map((p) => (
                      <tr key={p.name}>
                        <td>{p.name}</td>
                        <td>{p.qty}</td>
                        <td>₹{p.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </div>
          </section>
        )}

        {user?.role === 'ADMIN' && (
          <section className="dash-actions-section">
            <h2>Backend</h2>
            <div className="dash-action-grid">
              <Link to="/admin/products" className="dash-action-card">
                <span className="dash-action-icon">📦</span>
                <div><h3>Products</h3><p>Menu management</p></div>
                <span className="dash-action-arrow">→</span>
              </Link>
              <Link to="/admin/settings" className="dash-action-card">
                <span className="dash-action-icon">🔧</span>
                <div><h3>Category & Payments</h3><p>Settings</p></div>
                <span className="dash-action-arrow">→</span>
              </Link>
              <Link to="/admin/discounts" className="dash-action-card">
                <span className="dash-action-icon">🏷️</span>
                <div><h3>Coupons & Promotions</h3><p>Discounts</p></div>
                <span className="dash-action-arrow">→</span>
              </Link>
              <Link to="/bookings" className="dash-action-card">
                <span className="dash-action-icon">📅</span>
                <div><h3>Bookings</h3><p>Reservations</p></div>
                <span className="dash-action-arrow">→</span>
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
