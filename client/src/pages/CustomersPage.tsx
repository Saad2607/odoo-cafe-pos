import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer, Customer } from '../lib/api';
import { appConfirm } from '../context/DialogContext';
import '../styles/customers.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  function load(q?: string) {
    setLoading(true);
    fetchCustomers(q)
      .then((res) => setCustomers(res.customers))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', phone: '' });
    setShowForm(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await updateCustomer(editing.id, form);
        setMessage('Customer updated');
      } else {
        await createCustomer(form);
        setMessage('Customer created');
      }
      setShowForm(false);
      load(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    const ok = await appConfirm('Delete this customer? This cannot be undone.', {
      title: 'Delete customer',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCustomer(id);
      setMessage('Customer deleted');
      load(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <AppLayout title="Customers" subtitle="Search & manage">
      <div className="customers-page">
        <section className="page-hero">
          <h2>Customers</h2>
          <p>Search, add, and manage customer profiles for receipts and loyalty</p>
        </section>

        <div className="customers-toolbar">
          <form className="customers-search" onSubmit={handleSearch}>
            <input
              className="pill-input"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="terminal-btn cafe-btn-outline">Search</button>
          </form>
          <button type="button" className="terminal-btn cafe-btn-primary" onClick={openCreate}>
            + New Customer
          </button>
        </div>

        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="customers-grid">
          {customers.map((c) => (
            <article key={c.id} className="customer-card">
              <h4>{c.name}</h4>
              {c.email && <p>{c.email}</p>}
              {c.phone && <p>{c.phone}</p>}
              <div className="customer-card-actions">
                <button type="button" className="terminal-btn cafe-btn-outline" onClick={() => openEdit(c)}>
                  Edit
                </button>
                <button type="button" className="terminal-btn cafe-btn-danger" onClick={() => handleDelete(c.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>

        {showForm && (
          <div className="customer-form-overlay" onClick={() => setShowForm(false)}>
            <form className="customer-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>{editing ? 'Edit Customer' : 'New Customer'}</h3>
              <label>Name</label>
              <input className="pill-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label>Email</label>
              <input className="pill-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <label>Phone</label>
              <input className="pill-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div className="customer-form-actions">
                <button type="button" className="terminal-btn cafe-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="terminal-btn cafe-btn-primary">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
