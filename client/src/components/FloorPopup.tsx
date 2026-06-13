import { useNavigate } from 'react-router-dom';
import { Floor } from '../lib/api';
import '../styles/floor-plan.css';

const FLOOR_POPUP_KEY = 'odoo_show_floor_popup';

export function markFloorPopupForSession() {
  sessionStorage.setItem(FLOOR_POPUP_KEY, '1');
}

export function clearFloorPopupFlag() {
  sessionStorage.removeItem(FLOOR_POPUP_KEY);
}

export function shouldShowFloorPopup(): boolean {
  return sessionStorage.getItem(FLOOR_POPUP_KEY) === '1';
}

interface FloorPopupProps {
  floors: Floor[];
  onClose: () => void;
}

export default function FloorPopup({ floors, onClose }: FloorPopupProps) {
  const navigate = useNavigate();

  function selectTable(tableId: string) {
    clearFloorPopupFlag();
    navigate(`/order/${tableId}`);
  }

  return (
    <div className="floor-popup-overlay" onClick={onClose}>
      <div className="floor-popup" onClick={(e) => e.stopPropagation()}>
        <header className="floor-popup-header">
          <div>
            <h2>Select a Table</h2>
            <p>Choose a table to start taking orders</p>
          </div>
          <button type="button" className="floor-popup-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="floor-popup-body">
          {floors.length === 0 && (
            <p className="pos-muted">No floors configured yet. Ask admin to set up the floor plan.</p>
          )}
          {floors.map((floor) => (
            <section key={floor.id} className="floor-popup-section">
              <h3>{floor.name}</h3>
              <div className="floor-popup-grid">
                {floor.tables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    className={`floor-table-btn${table.status === 'OCCUPIED' ? ' occupied' : ''}`}
                    onClick={() => selectTable(table.id)}
                  >
                    <span className="num">{table.tableNumber}</span>
                    <span className="seats">{table.seats} seats</span>
                    <span className={`badge ${table.status === 'OCCUPIED' ? 'occupied' : 'free'}`}>
                      {table.status === 'OCCUPIED' ? 'In Service' : 'Available'}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
