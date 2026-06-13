import { useEffect, useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import TerminalLayout from '../components/TerminalLayout';
import {
  createProduct,
  deleteProduct,
  fetchAllProducts,
  fetchCategories,
  getStoredUser,
  Product,
  Category,
  updateProduct,
} from '../lib/api';
import '../styles/pos.css';

const emptyForm = {
  name: '',
  categoryId: '',
  price: '',
  unitOfMeasure: 'per piece',
  tax: '5',
  description: '',
};

export default function AdminProductsPage() {
  const user = getStoredUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function load() {
    Promise.all([fetchAllProducts(), fetchCategories()])
      .then(([p, c]) => {
        setProducts(p.products);
        setCategories(c.categories);
        if (!form.categoryId && c.categories[0]) {
          setForm((f) => ({ ...f, categoryId: c.categories[0].id }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/terminal" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price: Number(form.price),
      unitOfMeasure: form.unitOfMeasure,
      tax: Number(form.tax),
      description: form.description,
    };

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('Product updated');
      } else {
        await createProduct(payload);
        setMessage('Product created');
      }
      setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      categoryId: p.category?.id ?? '',
      price: String(p.price),
      unitOfMeasure: p.unitOfMeasure,
      tax: String(p.tax),
      description: p.description,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(id);
      setMessage('Product deactivated');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <TerminalLayout title="Admin" subtitle="Product management">
      <div className="pos-page admin-page">
        {loading && <p className="pos-muted">Loading…</p>}
        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="admin-layout">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <input className="pill-input" placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select className="pill-input" value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="pill-input" type="number" step="0.01" placeholder="Price" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="pill-input" placeholder="Unit (e.g. per piece)" value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} required />
            <input className="pill-input" type="number" placeholder="Tax %" value={form.tax}
              onChange={(e) => setForm({ ...form, tax: e.target.value })} required />
            <input className="pill-input" placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="admin-form-actions">
              <button type="submit" className="terminal-btn terminal-btn-primary">
                {editingId ? 'Update' : 'Add Product'}
              </button>
              {editingId && (
                <button type="button" className="terminal-btn terminal-btn-secondary"
                  onClick={() => { setEditingId(null); setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '' }); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="admin-list">
            <h3>All Products</h3>
            {products.map((p) => (
              <div key={p.id} className={`admin-product-row${p.isActive === false ? ' inactive' : ''}`}>
                <div>
                  <strong>{p.name}</strong>
                  <span className="pos-muted"> — ₹{p.price.toFixed(2)} · {p.category?.name}</span>
                  {p.isActive === false && <span className="inactive-tag">Inactive</span>}
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => startEdit(p)}>Edit</button>
                  {p.isActive !== false && (
                    <button type="button" onClick={() => handleDelete(p.id)}>Deactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
