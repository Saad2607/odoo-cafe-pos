import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { fetchLiveOps, LiveOpsData } from '../lib/api';
import '../styles/live-ops.css';

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{display}</>;
}

export default function LiveOpsPage() {
  const [data, setData] = useState<LiveOpsData | null>(null);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState(false);

  function load() {
    fetchLiveOps()
      .then((res) => {
        setData(res);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, []);

  const occupancy = data && data.stats.totalTables > 0
    ? Math.round((data.stats.activeTables / data.stats.totalTables) * 100)
    : 0;

  return (
    <AppLayout title="Live Ops" subtitle="Real-time command center">
    <div className="live-ops-page">
      <header className="live-ops-hero">
        <div>
          <span className="live-ops-badge"><span className="live-dot" /> LIVE</span>
          <h1>Operations Command Center</h1>
          <p>Real-time floor, kitchen & sales — updates every 4 seconds</p>
        </div>
        <div className="live-ops-hero-actions">
          <Link to="/kitchen" className="live-ops-btn">Open KDS →</Link>
          <Link to="/floor" className="live-ops-btn outline">Floor Plan →</Link>
        </div>
      </header>

      {error && <div className="pos-error">{error}</div>}

      {data && (
        <>
          <section className={`live-stats-grid${pulse ? ' pulse' : ''}`}>
            <article className="live-stat-card live-stat-revenue">
              <span className="live-stat-label">Session Revenue</span>
              <strong>₹<CountUp value={data.stats.totalSales} /></strong>
              <span className="live-stat-sub">{data.stats.paidCount} paid orders</span>
            </article>
            <article className="live-stat-card">
              <span className="live-stat-label">Kitchen Queue</span>
              <strong><CountUp value={data.stats.kitchenCount} /></strong>
              <span className="live-stat-sub">orders cooking now</span>
            </article>
            <article className="live-stat-card">
              <span className="live-stat-label">Floor Occupancy</span>
              <strong>{occupancy}%</strong>
              <span className="live-stat-sub">{data.stats.activeTables} / {data.stats.totalTables} tables</span>
            </article>
            <article className="live-stat-card">
              <span className="live-stat-label">Open Drafts</span>
              <strong><CountUp value={data.stats.draftCount} /></strong>
              <span className="live-stat-sub">awaiting payment</span>
            </article>
          </section>

          <div className="live-ops-grid">
            <section className="live-panel">
              <h2>Live Floor Map</h2>
              {data.floors.map((floor) => (
                <div key={floor.id} className="live-floor-block">
                  <h3>{floor.name}</h3>
                  <div className="live-table-grid">
                    {floor.tables.map((t) => (
                      <div
                        key={t.id}
                        className={`live-table-tile status-${t.status.toLowerCase()}`}
                      >
                        <span className="live-table-num">{t.tableNumber}</span>
                        <span className="live-table-seats">{t.seats} seats</span>
                        <span className="live-table-status">
                          {t.status === 'OCCUPIED' ? '● Active' : '○ Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="live-panel">
              <h2>Kitchen Radar</h2>
              {data.kitchenQueue.length === 0 && (
                <p className="pos-muted">Kitchen is clear — all caught up!</p>
              )}
              <ul className="live-kitchen-list">
                {data.kitchenQueue.map((o) => (
                  <li key={o.id} className={`live-kitchen-item status-${o.kitchenStatus.toLowerCase()}`}>
                    <div>
                      <strong>#{o.orderNumber.slice(-6)}</strong>
                      <span>Table {o.tableNumber ?? '—'} · {o.itemCount} items</span>
                    </div>
                    <span className="live-kitchen-pill">{o.kitchenStatus}</span>
                  </li>
                ))}
              </ul>

              <h2 className="live-subhead">Sales Ticker</h2>
              <ul className="live-ticker">
                {data.recentSales.map((s) => (
                  <li key={s.orderNumber}>
                    <span>{s.orderNumber}</span>
                    <span>₹{s.amount}</span>
                    <span>{s.paymentMethod ?? '—'}</span>
                    <span>{new Date(s.date).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {data.session.lastClosingSale != null && data.session.lastClosingSale > 0 && (
            <p className="live-session-note">
              Last session closing: ₹{data.session.lastClosingSale} · Current: {data.session.sessionNumber}
            </p>
          )}
        </>
      )}
    </div>
    </AppLayout>
  );
}
