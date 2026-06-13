import '../styles/session-terminal.css';

interface SessionCloseModalProps {
  summary: {
    sessionNumber: string;
    orderCount: number;
    totalSales: number;
    closedAt: string;
  };
  onDone: () => void;
}

export default function SessionCloseModal({ summary, onDone }: SessionCloseModalProps) {
  return (
    <div className="session-close-overlay">
      <div className="session-close-modal">
        <h2>Session Closed</h2>
        <p className="pos-muted">End-of-shift closing summary</p>
        <dl className="session-close-summary">
          <div><dt>Session</dt><dd>{summary.sessionNumber}</dd></div>
          <div><dt>Paid Orders</dt><dd>{summary.orderCount}</dd></div>
          <div><dt>Total Sales</dt><dd>₹{summary.totalSales.toFixed(0)}</dd></div>
          <div><dt>Closed At</dt><dd>{new Date(summary.closedAt).toLocaleString()}</dd></div>
        </dl>
        <button type="button" className="terminal-btn cafe-btn-primary" onClick={onDone}>
          Done — Return to Login
        </button>
      </div>
    </div>
  );
}
