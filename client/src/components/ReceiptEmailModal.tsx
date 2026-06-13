import { useState } from 'react';
import { sendReceiptEmail } from '../lib/api';
import '../styles/payment.css';

interface ReceiptEmailModalProps {
  orderId: string;
  defaultEmail?: string;
  onClose: () => void;
  onSent?: (email: string) => void;
}

export default function ReceiptEmailModal({ orderId, defaultEmail, onClose, onSent }: ReceiptEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await sendReceiptEmail(orderId, email.trim());
      setMessage('Receipt sent!');
      onSent?.(email.trim());
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="payment-overlay" onClick={onClose}>
      <form className="payment-modal discount-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="payment-header">
          <h3>Send Receipt</h3>
          <button type="button" className="payment-close" onClick={onClose}>×</button>
        </header>
        <p className="pos-muted">Email a receipt copy to the customer.</p>
        <input
          className="pill-input"
          type="email"
          placeholder="customer@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}
        <button type="submit" className="terminal-btn cafe-btn-primary payment-confirm" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Receipt'}
        </button>
      </form>
    </div>
  );
}
