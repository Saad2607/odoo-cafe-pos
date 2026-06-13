import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from '../lib/api';
import { markFloorPopupForSession } from './FloorPopup';
import '../styles/app-layout.css';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

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
          { to: '/admin/settings', label: 'Settings' },
        ]
      : []),
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <img src="/cafe.svg" alt="" className="app-brand-logo" width={32} height={32} />
          <div>
            <h1>{title || 'Dashboard'}</h1>
            <span>{subtitle || 'Odoo Cafe POS'}</span>
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-nav-link${location.pathname === item.to ? ' active' : ''}`}
              onClick={() => {
                if (item.to === '/floor' && user.role === 'EMPLOYEE') {
                  markFloorPopupForSession();
                }
              }}
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

      <main className="app-main">{children}</main>
    </div>
  );
}
