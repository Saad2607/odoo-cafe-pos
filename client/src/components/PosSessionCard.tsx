import { Link } from 'react-router-dom';
import '../styles/session-terminal.css';

interface PosSessionCardProps {
  sessionNumber: string;
  openedAt: string;
  lastClosingSale: number | null;
  totalSales: number;
  orderCount: number;
  onOpenSession: () => void;
}

export default function PosSessionCard({
  sessionNumber,
  openedAt,
  lastClosingSale,
  totalSales,
  orderCount,
  onOpenSession,
}: PosSessionCardProps) {
  const opened = new Date(openedAt).toLocaleString();

  return (
    <section className="pos-session-card">
      <div className="pos-session-head">
        <h2>POS Terminal</h2>
        <span className="pos-session-status">Session Open</span>
      </div>
      <div className="pos-session-grid">
        <div>
          <span className="pos-session-label">Current Session</span>
          <strong>{sessionNumber}</strong>
          <span className="pos-session-sub">Opened {opened}</span>
        </div>
        <div>
          <span className="pos-session-label">Last Closing Sale</span>
          <strong>{lastClosingSale != null && lastClosingSale > 0 ? `₹${lastClosingSale}` : '—'}</strong>
        </div>
        <div>
          <span className="pos-session-label">Session Revenue</span>
          <strong>₹{totalSales.toFixed(0)}</strong>
          <span className="pos-session-sub">{orderCount} orders</span>
        </div>
      </div>
      <div className="pos-session-actions">
        <button type="button" className="terminal-btn cafe-btn-primary" onClick={onOpenSession}>
          Open Session → Enter POS
        </button>
        <Link to="/reports" className="terminal-btn cafe-btn-outline">View Reports</Link>
      </div>
    </section>
  );
}
