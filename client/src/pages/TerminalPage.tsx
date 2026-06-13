import { Link } from 'react-router-dom';
import TerminalLayout from '../components/TerminalLayout';
import { getStoredSession } from '../lib/api';

export default function TerminalPage() {
  const session = getStoredSession();
  const openedAt = session ? new Date(session.openedAt).toLocaleString() : '—';

  return (
    <TerminalLayout title="POS Terminal" subtitle="Session Active">
      <div className="terminal-hub">
        <div className="terminal-welcome">
          <div className="terminal-welcome-icon">☕</div>
          <h2>Welcome to Odoo Cafe POS</h2>
          <p>Phase 2 is live — pick a table, take orders, and manage the kitchen.</p>

          <div className="session-card">
            <h3>Current Session</h3>
            <div className="session-detail"><span>Session ID</span><span>{session?.sessionNumber}</span></div>
            <div className="session-detail"><span>Opened At</span><span>{openedAt}</span></div>
            <div className="session-detail"><span>Status</span><span className="session-status">{session?.status}</span></div>
          </div>

          <div className="terminal-actions">
            <Link to="/floor" className="terminal-btn terminal-btn-primary">Open Floor Plan</Link>
            <Link to="/kitchen" className="terminal-btn terminal-btn-secondary">Kitchen Display</Link>
          </div>

          <div className="checkpoint-badge">✓ Phase 2 — Floor Plan, Orders & Kitchen Ready</div>
        </div>
      </div>
    </TerminalLayout>
  );
}
