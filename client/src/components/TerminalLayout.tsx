import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from '../lib/api';
import '../styles/terminal.css';

interface TerminalLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function TerminalLayout({ children, title, subtitle }: TerminalLayoutProps) {
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
    { to: '/terminal', label: 'Home' },
    { to: '/floor', label: 'Floor Plan' },
    { to: '/kitchen', label: 'Kitchen' },
    ...(user.role === 'ADMIN' ? [{ to: '/admin/products', label: 'Admin' }] : []),
  ];

  return (
    <div className="terminal-page">
      <header className="terminal-header">
        <div className="terminal-brand">
          <div className="terminal-brand-icon"><img src="/cafe.svg" alt="" width={28} height={28} /></div>
          <div>
            <h1>{title || 'POS Terminal'}</h1>
            <span>{subtitle || 'Odoo Cafe — Phase 3'}</span>
          </div>
        </div>

        <nav className="terminal-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`terminal-nav-link${location.pathname === item.to ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="terminal-user">
          <div className="terminal-user-info">
            <div className="terminal-user-name">{user.name}</div>
            <div className="terminal-user-role">
              {user.role === 'ADMIN' ? 'Admin' : 'Cashier'}
            </div>
          </div>
          <div className="terminal-user-avatar">{initials}</div>
          <button className="terminal-logout" onClick={handleLogout}>Log Out</button>
        </div>
      </header>

      <main className="terminal-main">{children}</main>
    </div>
  );
}
