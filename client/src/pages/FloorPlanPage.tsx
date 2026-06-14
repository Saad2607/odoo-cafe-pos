import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FloorPopup, { clearFloorPopupFlag, shouldShowFloorPopup } from '../components/FloorPopup';
import PosSessionCard from '../components/PosSessionCard';
import SessionCloseModal from '../components/SessionCloseModal';
import { useCloseSession } from '../hooks/useCloseSession';
import { fetchFloors, fetchSessionStats, getStoredUser, Floor } from '../lib/api';
import '../styles/pos.css';
import '../styles/floor-plan.css';
import '../styles/session-terminal.css';

export default function FloorPlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const isCashier = user?.role === 'EMPLOYEE';
  const { closing, closeSummary, handleCloseSession, finishCloseSession } = useCloseSession();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [session, setSession] = useState({
    sessionNumber: '',
    openedAt: '',
    lastClosingSale: null as number | null,
    totalSales: 0,
    orderCount: 0,
  });

  useEffect(() => {
    fetchFloors()
      .then((res) => setFloors(res.floors))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load floor plan'))
      .finally(() => setLoading(false));

    fetchSessionStats()
      .then((res) => setSession({
        sessionNumber: res.session.sessionNumber,
        openedAt: res.session.openedAt,
        lastClosingSale: res.session.lastClosingSale,
        totalSales: res.session.totalSales ?? 0,
        orderCount: res.session.orderCount ?? 0,
      }))
      .catch(() => undefined);

    if (shouldShowFloorPopup()) setShowPopup(true);
  }, [location.pathname]);

  function closePopup() {
    clearFloorPopupFlag();
    setShowPopup(false);
  }

  return (
    <AppLayout title="Table View" subtitle="Cashier · Floor & orders">
      <div className="pos-page cafe-floor-page">
        <section className="page-hero">
          <h2>Floor Plan</h2>
          <p>Select a table to start or continue an order · Session {session.sessionNumber || '—'}</p>
        </section>

        <div className="cashier-quick-strip">
          <Link to="/orders" className="cashier-quick-card">
            <strong>{session.orderCount}</strong>
            <span>Orders</span>
            <em>View all orders</em>
          </Link>
          <Link to="/kitchen" className="cashier-quick-card">
            <strong>KDS</strong>
            <span>Kitchen</span>
            <em>Live kitchen board</em>
          </Link>
          <Link to="/menu-explorer" className="cashier-quick-card">
            <strong>500+</strong>
            <span>Menu</span>
            <em>Browse catalog</em>
          </Link>
          <div className="cashier-quick-card" style={{ cursor: 'default' }}>
            <strong>₹{session.totalSales.toFixed(0)}</strong>
            <span>Sales</span>
            <em>This session</em>
          </div>
        </div>

        <PosSessionCard
          sessionNumber={session.sessionNumber}
          openedAt={session.openedAt}
          lastClosingSale={session.lastClosingSale}
          totalSales={session.totalSales}
          orderCount={session.orderCount}
          onOpenSession={() => setShowPopup(true)}
        />

        {isCashier && (
          <section className="floor-end-shift">
            <div className="floor-end-shift-copy">
              <strong>End of day?</strong>
              <p>Close your session after all orders are paid or cancelled. This locks today&apos;s sales totals.</p>
            </div>
            <button
              type="button"
              className="terminal-btn floor-end-shift-btn"
              onClick={() => handleCloseSession()}
              disabled={closing}
            >
              {closing ? 'Closing…' : 'End Shift — Close Session'}
            </button>
          </section>
        )}

        <p className="pos-muted floor-hint">
          Tap a table to open the order view. Occupied tables are highlighted.
        </p>

        {loading && <p className="pos-muted">Loading tables…</p>}
        {error && <div className="pos-error">{error}</div>}

        {!loading && !error && floors.map((floor) => (
          <section key={floor.id} className="floor-section">
            <h2 className="floor-name">{floor.name}</h2>
            <div className="table-grid">
              {floor.tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={`table-card table-${table.status.toLowerCase()}`}
                  onClick={() => navigate(`/order/${table.id}`)}
                >
                  <span className="table-number">{table.tableNumber}</span>
                  <span className="table-seats">{table.seats} seats</span>
                  <span className={`table-status ${table.status.toLowerCase()}`}>
                    {table.status === 'FREE' ? 'Available' : 'In Service'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {!loading && floors.every((f) => f.tables.length === 0) && (
          <p className="pos-muted">No tables yet. Admin can add floors and tables in Floor Plan Admin.</p>
        )}
      </div>

      {showPopup && floors.length > 0 && (
        <FloorPopup floors={floors} onClose={closePopup} />
      )}

      {closeSummary && (
        <SessionCloseModal summary={closeSummary} onDone={finishCloseSession} />
      )}
    </AppLayout>
  );
}
