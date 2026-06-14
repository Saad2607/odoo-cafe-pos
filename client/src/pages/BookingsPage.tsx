import { FormEvent, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  Booking,
  createBooking,
  deleteBooking,
  fetchAdminFloors,
  fetchBookings,
  getStoredUser,
  updateBooking,
} from '../lib/api';
import '../styles/pos.css';

const STATUS_OPTIONS: Booking['status'][] = ['PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED'];

const emptyForm = {
  customerName: '',
  email: '',
  phone: '',
  bookingDate: new Date().toISOString().slice(0, 10),
  bookingTime: '09:00',
  partySize: '2',
  tableId: '',
  notes: '',
};

export default function BookingsPage() {
  const user = getStoredUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<Array<{ id: string; tableNumber: number }>>([]);
  const [form, setForm] = useState(emptyForm);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    setLoading(true);
    fetchBookings({ date: filterDate })
      .then((res) => setBookings(res.bookings))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    fetchAdminFloors()
      .then((res) => {
        const all = res.floors.flatMap((f) => f.tables.map((t) => ({ id: t.id, tableNumber: t.tableNumber })));
        setTables(all);
      })
      .catch(() => undefined);
  }, [filterDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createBooking({
        customerName: form.customerName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        partySize: Number(form.partySize),
        tableId: form.tableId || undefined,
        notes: form.notes || undefined,
      });
      setForm({ ...emptyForm, bookingDate: filterDate });
      setMessage('Booking created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  }

  async function changeStatus(id: string, status: Booking['status']) {
    try {
      await updateBooking(id, { status });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <AppLayout title="Bookings" subtitle="Table reservations">
      <div className="pos-page admin-page">
        <section className="page-hero">
          <h2>Table Bookings</h2>
          <p>View and manage reservations by date</p>
        </section>

        <div className="bookings-toolbar">
          <label>
            Date
            <input type="date" className="pill-input" value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)} />
          </label>
        </div>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="admin-layout">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h3>New Booking</h3>
            <input className="pill-input" placeholder="Customer name" value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            <input className="pill-input" type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="pill-input" placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="pill-input" type="date" value={form.bookingDate}
              onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} required />
            <input className="pill-input" type="time" value={form.bookingTime}
              onChange={(e) => setForm({ ...form, bookingTime: e.target.value })} required />
            <input className="pill-input" type="number" min={1} placeholder="Party size" value={form.partySize}
              onChange={(e) => setForm({ ...form, partySize: e.target.value })} required />
            <select className="pill-input" value={form.tableId}
              onChange={(e) => setForm({ ...form, tableId: e.target.value })}>
              <option value="">No table assigned</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Table {t.tableNumber}</option>)}
            </select>
            <input className="pill-input" placeholder="Notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <button type="submit" className="terminal-btn cafe-btn-primary">Create Booking</button>
          </form>

          <div className="admin-table-wrap">
            <h3>Bookings for {filterDate}</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Party</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.bookingTime}</td>
                    <td>
                      <strong>{b.customerName}</strong>
                      {b.phone && <div className="pos-muted">{b.phone}</div>}
                    </td>
                    <td>{b.partySize}</td>
                    <td>{b.table ? `Table ${b.table.tableNumber}` : '—'}</td>
                    <td>
                      <select className="pill-input booking-status-select" value={b.status}
                        onChange={(e) => changeStatus(b.id, e.target.value as Booking['status'])}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      {user?.role === 'ADMIN' && (
                        <button type="button" className="terminal-btn cafe-btn-danger"
                          onClick={async () => { await deleteBooking(b.id); load(); }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && bookings.length === 0 && (
              <p className="pos-muted">No bookings for this date.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
