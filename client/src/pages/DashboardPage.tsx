import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { closeSession, fetchSessionStats, getStoredSession, getStoredUser } from '../lib/api';
import '../styles/dashboard.css';

const QUICK_ACTIONS = [
  {
    to: '/floor',
    title: 'Table View',
    desc: 'Select a table and start taking orders',
    icon: '🪑',
    primary: true,
  },
  {
    to: '/kitchen',
    title: 'Kitchen Display',
    desc: 'Track orders being prepared',
    icon: '👨‍🍳',
    primary: false,
  },
];

const MENU_HIGHLIGHTS = [
  { cat: 'SAVOURY', img: '/foods/pesto-eggs-toast.jpg', items: 'Pesto Eggs · Kejriwal · Benedict · Big Brekkie' },
  { cat: 'SWEET', img: '/foods/ricotta-pancakes.jpg', items: 'Smoothie Bowls · French Toast · Pancakes' },
];

export default function DashboardPage() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const session = getStoredSession();
  const [stats, setStats] = useState({
    paidOrderCount: 0,
    totalSales: 0,
    orderCount: 0,
    openedAt: '',
    lastClosingSale: 0,
  });
  const [closing, setClosing] = useState(false);
  const [closeMsg, setCloseMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionStats()
      .then((res) => {
        setStats({
          paidOrderCount: res.session.paidOrderCount ?? 0,
          totalSales: res.session.totalSales ?? 0,
          orderCount: res.session.orderCount ?? 0,
          openedAt: res.session.openedAt,
          lastClosingSale: res.session.lastClosingSale ?? 0,
        });
      })
      .catch(() => undefined);
  }, []);

  async function handleCloseSession() {
    if (!confirm('Close this POS session? All draft orders must be paid or cancelled first.')) return;
    setClosing(true);
    setError('');
    try {
      const res = await closeSession();
      setCloseMsg(`Session closed — ${res.summary.orderCount} orders, ₹${res.summary.totalSales.toFixed(0)} revenue.`);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
    } finally {
      setClosing(false);
    }
  }

  const avgOrder = stats.paidOrderCount > 0
    ? Math.round(stats.totalSales / stats.paidOrderCount)
    : 0;

  return (
    <AppLayout title="Dashboard" subtitle="Brivio Cafe · Food & Service">
      <div className="dashboard-page">
        <header className="dash-hero">
          <div className="dash-hero-text">
            <p className="dash-hello">Good morning, {user?.name?.split(' ')[0]}</p>
            <h1 className="dash-title">BRIVIO</h1>
            <p className="dash-hours">FROM 8:00 TO 11.30AM</p>
          </div>
          <div className="dash-hero-badge">
            <img src="/foods/pancake.jpg" alt="" />
          </div>
        </header>

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
              <span>Avg. Order</span>
            </div>
          </article>
        </section>

        <section className="dash-session-section">
          <h2>POS Session</h2>
          <div className="dash-session-card">
            <p><strong>Session:</strong> {session?.sessionNumber ?? '—'}</p>
            <p><strong>Opened:</strong> {stats.openedAt ? new Date(stats.openedAt).toLocaleString() : '—'}</p>
            <p><strong>Last closing sale:</strong> {stats.lastClosingSale > 0 ? `₹${stats.lastClosingSale}` : '—'}</p>
            {error && <div className="pos-error">{error}</div>}
            {closeMsg && <div className="pos-success">{closeMsg}</div>}
            <button
              type="button"
              className="terminal-btn cafe-btn-danger dash-close-btn"
              onClick={handleCloseSession}
              disabled={closing}
            >
              {closing ? 'Closing…' : 'Close Session & End Shift'}
            </button>
          </div>
        </section>

        <section className="dash-actions-section">
          <h2>Quick Actions</h2>
          <div className="dash-action-grid">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`dash-action-card${action.primary ? ' dash-action-primary' : ''}`}
              >
                <span className="dash-action-icon">{action.icon}</span>
                <div>
                  <h3>{action.title}</h3>
                  <p>{action.desc}</p>
                </div>
                <span className="dash-action-arrow">→</span>
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/products" className="dash-action-card">
                  <span className="dash-action-icon">⚙️</span>
                  <div>
                    <h3>Manage Menu</h3>
                    <p>Add or edit breakfast items</p>
                  </div>
                  <span className="dash-action-arrow">→</span>
                </Link>
                <Link to="/reports" className="dash-action-card">
                  <span className="dash-action-icon">📊</span>
                  <div>
                    <h3>Reports</h3>
                    <p>Sales analytics & exports</p>
                  </div>
                  <span className="dash-action-arrow">→</span>
                </Link>
                <Link to="/admin/users" className="dash-action-card">
                  <span className="dash-action-icon">👥</span>
                  <div>
                    <h3>Manage Users</h3>
                    <p>Employees & admins</p>
                  </div>
                  <span className="dash-action-arrow">→</span>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="dash-menu-section">
          <h2>Today's Menu</h2>
          <div className="dash-menu-cards">
            {MENU_HIGHLIGHTS.map((m) => (
              <article key={m.cat} className="dash-menu-card">
                <img src={m.img} alt={m.cat} />
                <div>
                  <h3>{m.cat}</h3>
                  <p>{m.items}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="dash-footer">
          <p className="dash-quote">Eat breakfast. Be nice to people. In that order.</p>
        </footer>
      </div>
    </AppLayout>
  );
}
