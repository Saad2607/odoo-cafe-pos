import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  createCategory,
  deleteCategory,
  fetchAllCategories,
  fetchPaymentSettings,
  updateCategory,
  updatePaymentSettings,
  Category,
  PaymentSettings,
} from '../lib/api';
import { appConfirm } from '../context/DialogContext';
import '../styles/admin-settings.css';

const CATEGORY_COLOR_PRESETS = [
  '#9E4B3A', '#C4785A', '#D4A574', '#2E7D32', '#1565C0',
  '#6A1B9A', '#E65100', '#5D4037', '#455A64', '#C62828',
];

function CategoryColorPicker({
  value,
  onChange,
  id,
  compact = false,
}: {
  value: string;
  onChange: (color: string) => void;
  id: string;
  compact?: boolean;
}) {
  return (
    <div className={`category-color-picker${compact ? ' category-color-picker--compact' : ''}`}>
      <label className="category-color-swatch-btn" htmlFor={id} title="Pick a color">
        <span className="category-color-swatch-ring" style={{ background: value }} aria-hidden />
        <input
          id={id}
          type="color"
          className="category-color-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <span className="category-color-hex">{value.toUpperCase()}</span>
      {!compact && (
        <div className="category-color-presets" role="group" aria-label="Preset colors">
          {CATEGORY_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`category-color-preset${value.toLowerCase() === preset.toLowerCase() ? ' active' : ''}`}
              style={{ background: preset }}
              onClick={() => onChange(preset)}
              title={preset}
              aria-label={`Use color ${preset}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [catForm, setCatForm] = useState({ name: '', color: '#9E4B3A' });
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([fetchAllCategories(), fetchPaymentSettings()])
      .then(([catRes, payRes]) => {
        setCategories(catRes.categories);
        setSettings(payRes.settings);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await createCategory(catForm);
      setCategories((prev) => [...prev, res.category]);
      setCatForm({ name: '', color: '#9E4B3A' });
      setMessage('Category added');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleSaveCategoryEdit() {
    if (!editingCat) return;
    try {
      const res = await updateCategory(editingCat.id, { name: editingCat.name, color: editingCat.color });
      setCategories((prev) => prev.map((c) => c.id === res.category.id ? res.category : c));
      setEditingCat(null);
      setMessage('Category updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDeleteCategory(id: string) {
    const ok = await appConfirm('Delete this category?', {
      title: 'Delete category',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function togglePayment(key: keyof PaymentSettings) {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    try {
      const res = await updatePaymentSettings({ [key]: updated[key] });
      setSettings(res.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function saveUpiId() {
    if (!settings) return;
    try {
      const res = await updatePaymentSettings({ upiId: settings.upiId });
      setSettings(res.settings);
      setMessage('UPI ID saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <AppLayout title="Admin Settings" subtitle="Categories & payments">
      <div className="admin-settings-page">
        <section className="page-hero">
          <h2>Admin Settings</h2>
          <p>Configure categories, payment methods, and cafe preferences</p>
        </section>

        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <section className="admin-section">
          <h3>Payment Methods</h3>
          {settings && (
            <div className="payment-toggles">
              <label><input type="checkbox" checked={settings.cashEnabled} onChange={() => togglePayment('cashEnabled')} /> Cash</label>
              <label><input type="checkbox" checked={settings.cardEnabled} onChange={() => togglePayment('cardEnabled')} /> Card</label>
              <label><input type="checkbox" checked={settings.upiEnabled} onChange={() => togglePayment('upiEnabled')} /> UPI</label>
              <div className="upi-id-row">
                <input
                  className="pill-input"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="UPI ID"
                />
                <button type="button" className="terminal-btn cafe-btn-outline" onClick={saveUpiId}>Save UPI</button>
              </div>
            </div>
          )}
        </section>

        <section className="admin-section">
          <h3>Categories</h3>
          <form className="category-form" onSubmit={handleAddCategory}>
            <input className="pill-input" placeholder="Category name" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            <CategoryColorPicker
              id="category-color-new"
              value={catForm.color}
              onChange={(color) => setCatForm({ ...catForm, color })}
            />
            <button type="submit" className="terminal-btn cafe-btn-primary">Add</button>
          </form>
          <ul className="category-list">
            {categories.map((c) => (
              <li key={c.id}>
                <span className="cat-swatch" style={{ background: c.color }} />
                {editingCat?.id === c.id ? (
                  <div className="category-list-edit-row">
                    <input className="pill-input" value={editingCat.name}
                      onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} />
                    <CategoryColorPicker
                      id={`category-color-edit-${c.id}`}
                      value={editingCat.color}
                      onChange={(color) => setEditingCat({ ...editingCat, color })}
                      compact
                    />
                    <div className="category-list-actions">
                      <button type="button" className="terminal-btn cafe-btn-primary" onClick={handleSaveCategoryEdit}>Save</button>
                      <button type="button" className="terminal-btn cafe-btn-outline" onClick={() => setEditingCat(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="category-list-name">{c.name}</span>
                    <div className="category-list-actions">
                      <button type="button" className="terminal-btn cafe-btn-outline" onClick={() => setEditingCat(c)}>Edit</button>
                      <button type="button" className="terminal-btn cafe-btn-danger" onClick={() => handleDeleteCategory(c.id)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppLayout>
  );
}
