import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  addTable,
  createFloor,
  deleteFloor,
  deleteTable,
  fetchAdminFloors,
  updateTable,
  AdminFloor,
} from '../lib/api';
import '../styles/floor-plan.css';

export default function AdminFloorPlanPage() {
  const [floors, setFloors] = useState<AdminFloor[]>([]);
  const [floorName, setFloorName] = useState('');
  const [tableForms, setTableForms] = useState<Record<string, { tableNumber: string; seats: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    setLoading(true);
    fetchAdminFloors()
      .then((res) => setFloors(res.floors))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreateFloor(e: React.FormEvent) {
    e.preventDefault();
    if (!floorName.trim()) return;
    try {
      await createFloor(floorName.trim());
      setFloorName('');
      setMessage('Floor created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create floor');
    }
  }

  async function handleAddTable(floorId: string) {
    const form = tableForms[floorId] ?? { tableNumber: '', seats: '4' };
    const tableNumber = parseInt(form.tableNumber, 10);
    const seats = parseInt(form.seats, 10);
    if (!tableNumber || !seats) {
      setError('Enter valid table number and seats');
      return;
    }
    try {
      await addTable(floorId, { tableNumber, seats });
      setTableForms((prev) => ({ ...prev, [floorId]: { tableNumber: '', seats: '4' } }));
      setMessage(`Table ${tableNumber} added`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add table');
    }
  }

  async function toggleTableActive(table: AdminFloor['tables'][0]) {
    try {
      await updateTable(table.id, { isActive: !table.isActive });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update table');
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm('Remove this table?')) return;
    try {
      await deleteTable(tableId);
      setMessage('Table removed');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove table');
    }
  }

  async function handleDeleteFloor(floorId: string) {
    if (!confirm('Delete this floor? All tables must be removed first.')) return;
    try {
      await deleteFloor(floorId);
      setMessage('Floor deleted');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete floor');
    }
  }

  return (
    <AppLayout title="Floor Plan Admin" subtitle="Create floors & tables">
      <div className="admin-floor-page">
        <form className="admin-floor-toolbar" onSubmit={handleCreateFloor}>
          <input
            className="pill-input"
            placeholder="New floor name (e.g. Terrace, 1st Floor)"
            value={floorName}
            onChange={(e) => setFloorName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">+ Add Floor</button>
        </form>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        {floors.map((floor) => {
          const form = tableForms[floor.id] ?? { tableNumber: '', seats: '4' };
          return (
            <article key={floor.id} className="admin-floor-card">
              <div className="admin-floor-card-head">
                <h3>{floor.name}</h3>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteFloor(floor.id)}
                >
                  Delete Floor
                </button>
              </div>

              <div className="admin-table-form">
                <input
                  className="pill-input"
                  type="number"
                  min={1}
                  placeholder="Table #"
                  value={form.tableNumber}
                  onChange={(e) => setTableForms((prev) => ({
                    ...prev,
                    [floor.id]: { ...form, tableNumber: e.target.value },
                  }))}
                />
                <input
                  className="pill-input"
                  type="number"
                  min={1}
                  placeholder="Seats"
                  value={form.seats}
                  onChange={(e) => setTableForms((prev) => ({
                    ...prev,
                    [floor.id]: { ...form, seats: e.target.value },
                  }))}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleAddTable(floor.id)}
                >
                  + Add Table
                </button>
              </div>

              <ul className="admin-table-list">
                {floor.tables.length === 0 && (
                  <li className="pos-muted">No tables on this floor yet.</li>
                )}
                {floor.tables.map((table) => (
                  <li key={table.id} className={table.isActive ? '' : 'table-inactive'}>
                    <span className="table-num">Table {table.tableNumber}</span>
                    <span>{table.seats} seats</span>
                    <span className={`status-pill ${table.isActive ? 'active' : 'inactive'}`}>
                      {table.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => toggleTableActive(table)}
                      >
                        {table.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTable(table.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}

        {!loading && floors.length === 0 && (
          <p className="pos-muted">Create your first floor above, then add tables to it.</p>
        )}
      </div>
    </AppLayout>
  );
}
