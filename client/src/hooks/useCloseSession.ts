import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, closeSession } from '../lib/api';
import { appAlert, appConfirm } from '../context/DialogContext';

export interface SessionCloseSummary {
  sessionNumber: string;
  orderCount: number;
  totalSales: number;
  totalTips?: number;
  closedAt: string;
}

export function useCloseSession() {
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);
  const [closeSummary, setCloseSummary] = useState<SessionCloseSummary | null>(null);

  async function handleCloseSession(options?: { skipConfirm?: boolean }) {
    if (!options?.skipConfirm) {
      const ok = await appConfirm(
        'Close this POS session and end your shift?\n\nAll orders must be paid or cancelled first.',
        { title: 'End Shift', confirmLabel: 'Close Session', variant: 'warning' },
      );
      if (!ok) return false;
    }

    setClosing(true);
    try {
      const res = await closeSession();
      setCloseSummary(res.summary);
      return true;
    } catch (err) {
      await appAlert(err instanceof Error ? err.message : 'Failed to close session', {
        title: 'Could not close session',
        variant: 'error',
      });
      return false;
    } finally {
      setClosing(false);
    }
  }

  function finishCloseSession() {
    setCloseSummary(null);
    clearAuth();
    navigate('/login', { replace: true });
  }

  return { closing, closeSummary, handleCloseSession, finishCloseSession };
}
