import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TerminalLayout from '../components/TerminalLayout';
import { fetchFloors, Floor } from '../lib/api';
import '../styles/pos.css';

export default function FloorPlanPage() {
  const navigate = useNavigate();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFloors()
      .then((res) => setFloors(res.floors))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load floor plan'))
      .finally(() => setLoading(false));
  }, []);

  function handleTableClick(tableId: string, status: string) {
    if (status === 'OCCUPIED') {
      navigate(`/order/${tableId}`);
      return;
    }
    navigate(`/order/${tableId}`);
  }

  return (
    <TerminalLayout title="Floor Plan" subtitle="Select a table to start an order">
      <div className="pos-page">
        {loading && <p className="pos-muted">Loading floor plan…</p>}
        {error && <div className="pos-error">{error}</div>}

        {!loading && !error && floors.map((floor) => (
          <section key={floor.id} className="floor-section">
            <h2>{floor.name}</h2>
            <div className="table-grid">
              {floor.tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={`table-card table-${table.status.toLowerCase()}`}
                  onClick={() => handleTableClick(table.id, table.status)}
                >
                  <span className="table-number">T{table.tableNumber}</span>
                  <span className="table-seats">{table.seats} seats</span>
                  <span className={`table-status ${table.status.toLowerCase()}`}>
                    {table.status === 'FREE' ? 'Available' : 'Occupied'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TerminalLayout>
  );
}
