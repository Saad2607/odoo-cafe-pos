import { useState, FormEvent } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { signup, saveAuth, getHomeRoute } from '../lib/api';
import AuthCoffeeBackground from '../components/AuthCoffeeBackground';
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

      navigate(getHomeRoute(res.user.role), { replace: true });

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Signup failed');

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

            <img src="/foods/ricotta-pancakes.jpg" alt="" />

          </div>

          <p className="auth-hero-kicker">Brivio Cafe · Food & Service</p>

          <h1 className="auth-hero-title">BRIVIO</h1>

          <p className="auth-hero-hours">FROM 8:00 TO 11.30AM</p>

          <p className="auth-hero-tagline">

            Create your admin account and start configuring your cafe POS.

          </p>

        </aside>



        <div className="auth-card">

          <div className="auth-logo">

            <div className="auth-logo-icon">

              <img src="/cafe.svg" alt="Odoo Cafe" width={32} height={32} />

            </div>

            <div>

              <h1>Odoo Cafe</h1>

              <span>Point of Sale</span>

            </div>

          </div>



          <div className="auth-title">

            <h2>Create account</h2>

            <p>Set up your cafe admin profile</p>

          </div>



          {error && <div className="auth-error">{error}</div>}



          <form onSubmit={handleSubmit}>

            <div className="pill-input-group">

              <label htmlFor="name">Name</label>

              <input

                id="name"

                type="text"

                className="pill-input"

                placeholder="Your full name"

                value={name}

                onChange={(e) => setName(e.target.value)}

                required

              />

            </div>



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

                placeholder="Min. 6 characters"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                required

                minLength={6}

              />

            </div>



            <div className="pill-input-group">

              <label htmlFor="confirmPassword">Confirm Password</label>

              <input

                id="confirmPassword"

                type="password"

                className="pill-input"

                placeholder="Re-enter password"

                value={confirmPassword}

                onChange={(e) => setConfirmPassword(e.target.value)}

                required

                minLength={6}

              />

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

    </div>

  );

}

