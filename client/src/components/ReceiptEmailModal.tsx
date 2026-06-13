import { useState } from 'react';
import { sendReceiptEmail } from '../lib/api';
import '../styles/payment.css';

interface ReceiptEmailModalProps {
  orderId: string;
  defaultEmail?: string;
  onClose: () => void;
  onSent?: (email: string, viewUrl: string) => void;
}

export default function ReceiptEmailModal({ orderId, defaultEmail, onClose, onSent }: ReceiptEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [viewUrl, setViewUrl] = useState('');

  async function sendReceipt() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    setWarning('');
    try {
      const res = await sendReceiptEmail(orderId, trimmed);
      setViewUrl(res.viewUrl);
      if (res.emailSent) {
        setMessage(`Gmail accepted the receipt for ${res.recipient ?? trimmed}`);
        setWarning('Ask your friend to check Inbox and Spam/Promotions. You can also share the view link below.');
      } else {
        setMessage(`Receipt link created for ${res.recipient ?? trimmed}`);
        if (res.emailError) setWarning(res.emailError);
      }
      onSent?.(trimmed, res.viewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send receipt');
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (viewUrl) navigator.clipboard.writeText(viewUrl);
  }

  return (
    <div
      className="payment-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="payment-modal discount-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="payment-header">
          <h3>Send Receipt</h3>
          <button type="button" className="payment-close" onClick={onClose}>×</button>
        </header>
        <p className="pos-muted">Send to the customer&apos;s email, or copy the view link and share on WhatsApp.</p>
        <input
          className="pill-input"
          type="email"
          placeholder="friend@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReceipt(); } }}
        />
        {error && <div className="pos-error">{error}</div>}
        {warning && <div className="pos-warning">{warning}</div>}
        {message && <div className="pos-success">{message}</div>}
        {viewUrl && (
          <div className="receipt-view-link">
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">Open receipt in browser →</a>
            <button type="button" className="terminal-btn cafe-btn-outline receipt-copy-btn" onClick={copyLink}>
              Copy link for friend
            </button>
          </div>
        )}
        <button
          type="button"
          className="terminal-btn cafe-btn-primary payment-confirm"
          disabled={submitting || !email.trim()}
          onClick={sendReceipt}
        >
          {submitting ? 'Sending…' : 'Send Receipt'}
        </button>
      </div>
    </div>
  );
}
