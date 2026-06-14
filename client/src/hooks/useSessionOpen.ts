import { useEffect, useState } from 'react';
import { fetchSessionStats, getStoredSession } from '../lib/api';

export function useSessionOpen(refreshKey?: string) {
  const [sessionOpen, setSessionOpen] = useState(
    () => getStoredSession()?.status === 'OPEN',
  );

  useEffect(() => {
    fetchSessionStats()
      .then((res) => setSessionOpen(res.session.status === 'OPEN'))
      .catch(() => undefined);
  }, [refreshKey]);

  async function refreshSessionOpen() {
    try {
      const res = await fetchSessionStats();
      const open = res.session.status === 'OPEN';
      setSessionOpen(open);
      return open;
    } catch {
      return sessionOpen;
    }
  }

  return { sessionOpen, setSessionOpen, refreshSessionOpen };
}
