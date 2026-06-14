import { useEffect, useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  createCategory,
  createProduct,
  deleteProduct,
  fetchAllProducts,
  fetchCategories,
  getStoredUser,
  Product,
  Category,
  updateProduct,
} from '../lib/api';
import { appConfirm } from '../context/DialogContext';
import '../styles/pos.css';
import '../styles/menu-explorer.css';

const emptyForm = {
  name: '',
  categoryId: '',
  price: '',
  unitOfMeasure: 'per piece',
  tax: '5',
  description: '',
  sendToKitchen: true,
};

const PAGE_SIZE = 50;

export default function AdminProductsPage() {
  const user = getStoredUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [newCat, setNewCat] = useState({ name: '', color: '#9E4B3A' });
  const [showNewCat, setShowNewCat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('');

  function load(p = page) {
    setLoading(true);
    Promise.all([
      fetchAllProducts({ page: p, limit: PAGE_SIZE, categoryId: filterCat || undefined, q: searchQ || undefined }),
      fetchCategories(),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.products);
        setTotal(prodRes.total);
        setPage(prodRes.page);
        setCategories(catRes.categories);
        if (!form.categoryId && catRes.categories[0]) {
          setForm((f) => ({ ...f, categoryId: catRes.categories[0].id }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, [filterCat]);

  useEffect(() => {
    const timer = setTimeout(() => load(1), searchQ ? 350 : 0);
    return () => clearTimeout(timer);
  }, [searchQ]);

  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleCreateCategory() {
    if (!newCat.name.trim()) return;
    try {
      const res = await createCategory(newCat);
      setCategories((prev) => [...prev, res.category]);
      setForm((f) => ({ ...f, categoryId: res.category.id }));
      setNewCat({ name: '', color: '#9E4B3A' });
      setShowNewCat(false);
      setMessage('Category created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

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
      sendToKitchen: form.sendToKitchen,
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
      load(page);
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
      sendToKitchen: p.sendToKitchen !== false,
    });
  }

  async function handleDelete(id: string) {
    const ok = await appConfirm('Deactivate this product?', {
      title: 'Deactivate product',
      confirmLabel: 'Deactivate',
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await deleteProduct(id);
      setMessage('Product deactivated');
      load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <AppLayout title="Menu Admin" subtitle={`${total} products · paginated catalog`}>
      <div className="pos-page admin-page">
        <section className="page-hero">
          <h2>Menu Admin</h2>
          <p>{total} products across {categories.length} categories — add, edit, and paginate the catalog</p>
        </section>

        {error && <div className="pos-error">{error}</div>}
        {message && <div className="pos-success">{message}</div>}

        <div className="admin-layout">
          <form className="admin-form" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <input className="pill-input" placeholder="Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div className="category-pick-row">
              <select className="pill-input" value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className="terminal-btn cafe-btn-outline"
                onClick={() => setShowNewCat((v) => !v)}>+ New</button>
            </div>
            {showNewCat && (
              <div className="inline-cat-form">
                <input className="pill-input" placeholder="Category name" value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
                <input type="color" value={newCat.color}
                  onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} />
                <button type="button" className="terminal-btn cafe-btn-primary" onClick={handleCreateCategory}>
                  Add Category
                </button>
              </div>
            )}
            <input className="pill-input" type="number" step="0.01" placeholder="Price" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="pill-input" placeholder="Unit (e.g. per piece)" value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} required />
            <input className="pill-input" type="number" placeholder="Tax %" value={form.tax}
              onChange={(e) => setForm({ ...form, tax: e.target.value })} required />
            <input className="pill-input" placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="admin-check">
              <input type="checkbox" checked={form.sendToKitchen}
                onChange={(e) => setForm({ ...form, sendToKitchen: e.target.checked })} />
              Send to Kitchen Display
            </label>
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
            <h3>All Products ({total})</h3>
            <div className="explorer-toolbar" style={{ marginBottom: '0.75rem' }}>
              <input
                className="pill-input explorer-search"
                placeholder="Search products…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              <select className="pill-input" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {loading && <p className="pos-muted">Loading…</p>}

            {products.map((p) => (
              <div key={p.id} className={`admin-product-row${p.isActive === false ? ' inactive' : ''}`}>
                <div>
                  {p.category && <span className="cat-dot" style={{ background: p.category.color }} />}
                  <strong>{p.name}</strong>
                  <span className="pos-muted"> — ₹{p.price.toFixed(2)} · {p.category?.name}</span>
                  {p.isBestseller && <span className="inactive-tag">⭐</span>}
                  {p.isNewArrival && <span className="inactive-tag">NEW</span>}
                  {p.sendToKitchen === false && <span className="inactive-tag">No KDS</span>}
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

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button type="button" className="terminal-btn cafe-btn-outline" disabled={page <= 1}
                  onClick={() => load(page - 1)}>← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" className="terminal-btn cafe-btn-outline" disabled={page >= totalPages}
                  onClick={() => load(page + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
