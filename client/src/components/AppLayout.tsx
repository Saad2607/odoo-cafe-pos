import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  clearAuth,
  fetchProducts,
  getCurrentTable,
  getStoredUser,
  Product,
} from '../lib/api';
import { markFloorPopupForSession } from './FloorPopup';
import SessionCloseModal from './SessionCloseModal';
import { appConfirm } from '../context/DialogContext';
import { useCloseSession } from '../hooks/useCloseSession';
import { useSessionOpen } from '../hooks/useSessionOpen';
import '../styles/app-layout.css';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideNav?: boolean;
}

const POS_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/floor', label: 'Table View' },
  { to: '/menu-explorer', label: 'Menu Explorer' },
  { to: '/orders', label: 'Orders' },
  { to: '/customers', label: 'Customers' },
  { to: '/kitchen', label: 'KDS' },
  { to: '/bookings', label: 'Bookings' },
];

const MENU_ADMIN = { to: '/admin/products', label: 'Menu Admin' };

const USER_MENU_NAV = [
  { to: '/admin/floors', label: 'Floor Plan' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/discounts', label: 'Discounts' },
  { to: '/reports', label: 'Reports' },
  { to: '/live-ops', label: 'Live Ops' },
];

export default function AppLayout({ children, subtitle, hideNav }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentTable, setCurrentTableState] = useState<number | null>(getCurrentTable());
  const { closing, closeSummary, handleCloseSession, finishCloseSession } = useCloseSession();
  const { refreshSessionOpen } = useSessionOpen(location.pathname);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTableState(getCurrentTable()), 1000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(() => {
      fetchProducts({ q: searchQ.trim(), limit: 8 })
        .then((res) => {
          setProducts(res.products);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    setUserMenuOpen(false);
    setMenuOpen(false);

    if (user?.role === 'EMPLOYEE') {
      const open = await refreshSessionOpen();
      if (open) {
        const closeFirst = await appConfirm(
          'Close your session and end your shift now? (Recommended)\n\nAll orders must be paid or cancelled first.',
          { title: 'Session still open', confirmLabel: 'End Shift', cancelLabel: 'Stay signed in', variant: 'warning' },
        );
        if (closeFirst) {
          await handleCloseSession({ skipConfirm: true });
          return;
        }

        const signOutAnyway = await appConfirm(
          'Unsettled orders should be paid or cancelled before the next shift close.',
          { title: 'Sign out without closing?', confirmLabel: 'Sign Out', cancelLabel: 'Stay signed in', variant: 'danger' },
        );
        if (!signOutAnyway) return;
      }
    }

    clearAuth();
    navigate('/login', { replace: true });
  }

  async function onCloseSessionClick() {
    setUserMenuOpen(false);
    setMenuOpen(false);
    await handleCloseSession();
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const isAdmin = user.role === 'ADMIN';
  const isCashier = user.role === 'EMPLOYEE';
  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  function handleNavClick() {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  function handleFloorNav() {
    if (user?.role === 'EMPLOYEE') {
      markFloorPopupForSession();
    }
    handleNavClick();
  }

  if (hideNav) {
    return <main className="app-main app-main-full">{children}</main>;
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
            <img src="/cafe.svg" alt="" className="app-brand-logo" width={44} height={44} />
            <div>
              <h1>Brivio</h1>
              <span>{subtitle || 'Odoo Cafe POS'}</span>
            </div>
          </div>
        </div>

        <div className="app-search-wrap" ref={searchRef}>
          {currentTable != null && (
            <span className="app-table-indicator">Table {currentTable}</span>
          )}
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
                      if (isAdmin) navigate('/admin/products');
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
          {POS_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-nav-link${isActive(item.to) ? ' active' : ''}`}
              onClick={item.to === '/floor' ? handleFloorNav : handleNavClick}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to={MENU_ADMIN.to}
              className={`app-nav-link${isActive(MENU_ADMIN.to) ? ' active' : ''}`}
              onClick={handleNavClick}
            >
              {MENU_ADMIN.label}
            </Link>
          )}
        </nav>

        <div className="app-user-menu" ref={userMenuRef}>
          <button
            type="button"
            className={`app-user-trigger${userMenuOpen ? ' open' : ''}`}
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="app-user-info">
              <div className="app-user-name">{user.name}</div>
              <div className="app-user-role">{isAdmin ? 'Admin' : 'Cashier'}</div>
            </div>
            <div className="app-user-avatar">{initials}</div>
            <span className="app-user-chevron">▾</span>
          </button>

          {userMenuOpen && (
            <div className="app-user-dropdown">
              {isAdmin && USER_MENU_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-user-dropdown-link${isActive(item.to) ? ' active' : ''}`}
                  onClick={handleNavClick}
                >
                  {item.label}
                </Link>
              ))}
              {isCashier && (
                <>
                  <div className="app-user-dropdown-divider" />
                  <button
                    type="button"
                    className="app-user-dropdown-action danger"
                    onClick={onCloseSessionClick}
                    disabled={closing}
                  >
                    {closing ? 'Closing…' : 'End Shift'}
                  </button>
                </>
              )}
              <div className="app-user-dropdown-divider" />
              <button
                type="button"
                className="app-user-dropdown-action"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="app-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <aside className="app-drawer">
            <header className="app-drawer-head">
              <h2>Navigation</h2>
              <button type="button" className="app-drawer-close" onClick={() => setMenuOpen(false)}>×</button>
            </header>

            <p className="app-drawer-label">POS</p>
            <nav className="app-drawer-nav">
              {POS_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`app-drawer-link${isActive(item.to) ? ' active' : ''}`}
                  onClick={item.to === '/floor' ? handleFloorNav : handleNavClick}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to={MENU_ADMIN.to}
                  className={`app-drawer-link${isActive(MENU_ADMIN.to) ? ' active' : ''}`}
                  onClick={handleNavClick}
                >
                  {MENU_ADMIN.label}
                </Link>
              )}
            </nav>

            {isAdmin && (
              <>
                <p className="app-drawer-label">Account</p>
                <nav className="app-drawer-nav">
                  {USER_MENU_NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`app-drawer-link${isActive(item.to) ? ' active' : ''}`}
                      onClick={handleNavClick}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </>
            )}

            <div className="app-drawer-footer">
              {isCashier && (
                <button
                  type="button"
                  className="app-drawer-end-shift"
                  onClick={onCloseSessionClick}
                  disabled={closing}
                >
                  {closing ? 'Closing…' : 'End Shift'}
                </button>
              )}
              <button type="button" className="app-drawer-signout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="app-main">{children}</main>

      {closeSummary && (
        <SessionCloseModal summary={closeSummary} onDone={finishCloseSession} />
      )}
    </div>
  );
}
