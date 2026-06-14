import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, saveAuth, getHomeRoute } from '../lib/api';
import { markFloorPopupForSession } from '../components/FloorPopup';
import AuthCoffeeBackground from '../components/AuthCoffeeBackground';
import '../styles/auth.css';

const HERO_IMG = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&q=80';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      saveAuth(res.token, res.user, res.session);
      if (res.user.role === 'EMPLOYEE') markFloorPopupForSession();
      navigate(getHomeRoute(res.user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page auth-page--coffee">
      <AuthCoffeeBackground />
      <div className="auth-layout">
        <aside className="auth-hero">
          <div className="auth-hero-badge">
            <img src={HERO_IMG} alt="" />
          </div>
          <p className="auth-hero-kicker">Brivio Cafe · Premium POS</p>
          <h1 className="auth-hero-title">BRIVIO</h1>
          <p className="auth-hero-hours">FOOD · COFFEE · SERVICE</p>
          <p className="auth-hero-tagline">
            Sign in to run the floor, take orders across 500+ menu items, and manage your session.
          </p>
          <ul className="auth-hero-features">
            <li>Table & order management</li>
            <li>Kitchen display & live ops</li>
            <li>Admin reports & mega menu</li>
          </ul>
        </aside>

        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <img src="/cafe.svg" alt="Brivio" width={40} height={40} />
            </div>
            <div>
              <h1>Brivio Cafe</h1>
              <span>Point of Sale</span>
            </div>
          </div>

          <div className="auth-title">
            <h2>Welcome back</h2>
            <p>Sign in to open your POS session</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="pill-input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="pill-input"
                placeholder="you@cafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="pill-input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="pill-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="pill-button pill-button-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            New here? <Link to="/signup">Create an account</Link>
          </p>

          <div className="auth-demo-hint">
            <strong>Demo</strong><br />
            Admin: admin@cafe.com / admin123<br />
            Cashier: cashier@cafe.com / cashier123
          </div>
        </div>
      </div>
    </div>
  );
}
