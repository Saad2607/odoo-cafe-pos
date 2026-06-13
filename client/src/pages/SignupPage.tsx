import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup, saveAuth } from '../lib/api';
import '../styles/auth.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(name, email, password);
      saveAuth(res.token, res.user, res.session);
      navigate('/terminal', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><img src="/cafe.svg" alt="Odoo Cafe" width={48} height={48} /></div>
          <div>
            <h1>Odoo Cafe</h1>
            <span>Point of Sale — MERN</span>
          </div>
        </div>

        <div className="auth-title">
          <h2>Create account</h2>
          <p>Sign up to start your POS terminal</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="pill-input-group">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" className="pill-input" placeholder="Your full name"
              value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="pill-input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="pill-input" placeholder="you@cafe.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="pill-input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="pill-input" placeholder="Min. 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <div className="pill-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" className="pill-input" placeholder="Re-enter password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>

          <button type="submit" className="pill-button pill-button-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}