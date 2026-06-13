import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, fetchProducts, getStoredUser, Product } from '../lib/api';
import { markFloorPopupForSession } from './FloorPopup';
import '../styles/app-layout.css';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, subtitle }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts()
        .then((res) => {
          const q = searchQ.toLowerCase();
          setProducts(res.products.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.category?.name.toLowerCase().includes(q),
          ).slice(0, 8));
          setSearchOpen(true);
        })
        .catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQ]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/floor', label: 'Table View' },
    { to: '/orders', label: 'Orders' },
    { to: '/customers', label: 'Customers' },
    { to: '/kitchen', label: 'Kitchen' },
    ...(user.role === 'ADMIN'
      ? [
          { to: '/admin/products', label: 'Menu Admin' },
          { to: '/admin/floors', label: 'Floor Plan' },
          { to: '/admin/users', label: 'Users' },
          { to: '/admin/discounts', label: 'Discounts' },
          { to: '/reports', label: 'Reports' },
          { to: '/admin/settings', label: 'Settings' },
        ]
      : []),
  ];

  function handleNavClick(to: string) {
    if (to === '/floor' && user?.role === 'EMPLOYEE') {
      markFloorPopupForSession();
    }
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <button
            type="button"
            className="app-hamburger"
            aria-label="Open menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
          <div className="app-brand">
            <img src="/cafe.svg" alt="" className="app-brand-logo" width={32} height={32} />
            <div>
              <h1>{'Brivio'}</h1>
              <span>{subtitle || 'Odoo Cafe POS'}</span>
            </div>
          </div>
        </div>

        <div className="app-search-wrap" ref={searchRef}>
          <input
            className="app-search-input"
            placeholder="Search menu items…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onFocus={() => products.length > 0 && setSearchOpen(true)}
          />
          {searchOpen && products.length > 0 && (
            <ul className="app-search-results">
              {products.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQ('');
                      setSearchOpen(false);
                      if (user.role === 'ADMIN') navigate('/admin/products');
                    }}
                  >
                    <strong>{p.name}</strong>
                    <span>₹{p.price} · {p.category?.name ?? '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="app-nav app-nav-desktop">
          {navItems.slice(0, 6).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-nav-link${location.pathname === item.to ? ' active' : ''}`}
              onClick={() => handleNavClick(item.to)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-user">
          <div className="app-user-info">
            <div className="app-user-name">{user.name}</div>
            <div className="app-user-role">{user.role === 'ADMIN' ? 'Admin' : 'Cashier'}</div>
          </div>
          <div className="app-user-avatar">{initials}</div>
          <button className="app-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="app-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <aside className="app-drawer">
            <h2>Menu</h2>
            <nav className="app-drawer-nav">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-drawer-link${location.pathname === item.to ? ' active' : ''}`}
                  onClick={() => handleNavClick(item.to)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}

      <main className="app-main">{children}</main>
    </div>
  );
}
