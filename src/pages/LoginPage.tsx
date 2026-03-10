import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      await login(email, password);   // token stored in-memory via AuthContext
      navigate('/vault');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-bg-glow" />

      {/* Left panel — branding */}
      <div className="auth-panel-left">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">🔒</span>
          <span>MyPasswordVault</span>
        </Link>
        <div className="auth-panel-tagline">
          <h2>One vault.<br />Zero worries.</h2>
          <p>Your digital life, secured with AES-256 encryption.</p>
        </div>
        <div className="auth-panel-stats">
          {[
            { val: '256-bit', label: 'Encryption' },
            { val: 'JWT', label: 'Auth tokens' },
            { val: '100%', label: 'Private' },
          ].map(s => (
            <div className="auth-stat" key={s.label}>
              <span className="auth-stat-val">{s.val}</span>
              <span className="auth-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-panel-right">
        <div className="auth-card card fade-in">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your vault</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your master password"
                  required
                  autoComplete="current-password"
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            {error && <p className="auth-error" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <hr className="divider" />

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
