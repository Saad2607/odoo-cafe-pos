import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import FloorPopup, { clearFloorPopupFlag, shouldShowFloorPopup } from '../components/FloorPopup';
import PosSessionCard from '../components/PosSessionCard';
import { fetchFloors, fetchSessionStats, Floor } from '../lib/api';
import '../styles/pos.css';
import '../styles/floor-plan.css';
import '../styles/session-terminal.css';

export default function FloorPlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <AppLayout title="Table View" subtitle="Floor plan & table selection">
      <div className="pos-page cafe-floor-page">
        <PosSessionCard
          sessionNumber={session.sessionNumber}
          openedAt={session.openedAt}
          lastClosingSale={session.lastClosingSale}
          totalSales={session.totalSales}
          orderCount={session.orderCount}
          onOpenSession={() => setShowPopup(true)}
        />
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
    </AppLayout>
  );
}
