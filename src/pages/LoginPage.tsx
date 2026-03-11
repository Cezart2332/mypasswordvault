import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const resetSuccess = (location.state as any)?.resetSuccess === true;
  const stateMessage: string | undefined = (location.state as any)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const result = await login(email, password);
      if (result?.requiresTwoFactor) {
        navigate('/two-factor', { state: { pendingToken: result.pendingToken, vaultKey: result.vaultKey } });
        return;
      }
      navigate('/vault');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('verif')) {
        navigate('/verify-email', { state: { email } });
        return;
      }
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
          <FiLock size={20} className="auth-brand-icon" />
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

          {(resetSuccess || stateMessage) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#4ade80',
            }}>
              <FiCheckCircle size={16} />
              {stateMessage ?? 'Password reset successfully. You can now sign in with your new password.'}
            </div>
          )}

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
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
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

            <p className="auth-switch" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <Link to="/forgot-password">Forgot your password?</Link>
            </p>
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
