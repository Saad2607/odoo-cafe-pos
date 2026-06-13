import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TerminalLayout from '../components/TerminalLayout';
import {
  clearAuth,
  closeSession,
  fetchSessionStats,
  getStoredUser,
} from '../lib/api';
import '../styles/terminal.css';
import '../styles/pos.css';

export default function TerminalPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [stats, setStats] = useState<{
    sessionNumber: string;
    openedAt: string;
    status: string;
    orderCount: number;
    paidOrderCount: number;
    totalSales: number;
  } | null>(null);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionStats()
      .then((res) => setStats(res.session))
      .catch(() => setStats(null));
  }, []);

  async function handleCloseSession() {
    if (!confirm('Close this POS session? All orders must be paid first.')) return;
    setClosing(true);
    setError('');
    try {
      const res = await closeSession();
      setMessage(
        `Session closed. ${res.summary.orderCount} orders — $${res.summary.totalSales.toFixed(2)} total sales.`,
      );
      setTimeout(() => {
        clearAuth();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
    } finally {
      setClosing(false);
    }
  }

  const openedAt = stats ? new Date(stats.openedAt).toLocaleString() : '—';

  return (
    <TerminalLayout title="POS Terminal" subtitle="Session Active">
      <div className="terminal-hub">
        <div className="terminal-welcome">
          <div className="terminal-welcome-icon">☕</div>
          <h2>Welcome, {user?.name}</h2>
          <p>Manage tables, orders, kitchen, and close your shift when done.</p>

          {error && <div className="pos-error">{error}</div>}
          {message && <div className="pos-success">{message}</div>}

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{stats?.paidOrderCount ?? 0}</span>
              <span className="stat-label">Paid Orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">₹{(stats?.totalSales ?? 0).toFixed(2)}</span>
              <span className="stat-label">Session Sales</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats?.orderCount ?? 0}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>

          <div className="session-card">
            <h3>Current Session</h3>
            <div className="session-detail"><span>Session ID</span><span>{stats?.sessionNumber}</span></div>
            <div className="session-detail"><span>Opened At</span><span>{openedAt}</span></div>
            <div className="session-detail"><span>Status</span><span className="session-status">{stats?.status}</span></div>
          </div>

          <div className="terminal-actions">
            <Link to="/floor" className="terminal-btn terminal-btn-primary">Open Floor Plan</Link>
            <Link to="/kitchen" className="terminal-btn terminal-btn-secondary">Kitchen Display</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin/products" className="terminal-btn terminal-btn-secondary">Manage Products</Link>
            )}
          </div>

          <button
            type="button"
            className="terminal-btn terminal-btn-close"
            onClick={handleCloseSession}
            disabled={closing}
          >
            {closing ? 'Closing…' : 'Close Session & Log Out'}
          </button>

          <div className="checkpoint-badge">✓ Phase 3 — Admin, Coupons & Session Close</div>
        </div>
      </div>
    </TerminalLayout>
  );
}
