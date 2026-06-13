import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  archiveUser,
  changeUserPassword,
  createUser,
  deleteUser,
  fetchUsers,
  getStoredUser,
  restoreUser,
  User,
} from '../lib/api';
import '../styles/pos.css';

const emptyForm = { name: '', email: '', password: '', role: 'EMPLOYEE' as User['role'] };

export default function AdminUsersPage() {
  const user = getStoredUser();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    fetchUsers()
      .then((res) => setUsers(res.users))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await createUser(form);
      setForm(emptyForm);
      setMessage('User created');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (!passwordFor) return;
    try {
      await changeUserPassword(passwordFor, newPassword);
      setPasswordFor(null);
      setNewPassword('');
      setMessage('Password updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update failed');
    }
  }

  async function toggleArchive(u: User) {
    try {
      if (u.isActive) await archiveUser(u.id);
      else await restoreUser(u.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await deleteUser(id);
      setMessage('User deleted');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <AppLayout title="Users" subtitle="Employees & admins">
      <div className="pos-page admin-page">
        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="admin-layout">
          <form className="admin-form" onSubmit={handleCreate}>
            <h3>Add User</h3>
            <input className="pill-input" placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="pill-input" type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="pill-input" type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            <select className="pill-input" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
              <option value="EMPLOYEE">Cashier</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="terminal-btn cafe-btn-primary">Create User</button>
          </form>

          <div className="admin-table-wrap">
            <h3>All Users</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={!u.isActive ? 'row-inactive' : ''}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role === 'ADMIN' ? 'Admin' : 'Cashier'}</td>
                    <td>{u.isActive ? 'Active' : 'Archived'}</td>
                    <td className="admin-actions">
                      <button type="button" className="terminal-btn cafe-btn-outline"
                        onClick={() => { setPasswordFor(u.id); setNewPassword(''); }}>
                        Password
                      </button>
                      <button type="button" className="terminal-btn cafe-btn-outline"
                        onClick={() => toggleArchive(u)}>
                        {u.isActive ? 'Archive' : 'Restore'}
                      </button>
                      {u.id !== user.id && (
                        <button type="button" className="terminal-btn cafe-btn-danger"
                          onClick={() => handleDelete(u.id)}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {passwordFor && (
          <div className="admin-modal-overlay" onClick={() => setPasswordFor(null)}>
            <form className="admin-modal" onClick={(e) => e.stopPropagation()} onSubmit={handlePassword}>
              <h3>Set New Password</h3>
              <input className="pill-input" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                placeholder="Min 6 characters" />
              <div className="admin-modal-actions">
                <button type="button" className="terminal-btn cafe-btn-outline"
                  onClick={() => setPasswordFor(null)}>Cancel</button>
                <button type="submit" className="terminal-btn cafe-btn-primary">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
