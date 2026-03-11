import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLock, FiMail, FiCheckCircle } from 'react-icons/fi';
import { forgotPassword } from '../services/authService';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setSubmitted(true);
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
          <h2>Reset your<br />master password.</h2>
          <p>We'll send a reset link to your email address if an account exists.</p>
        </div>
        <div className="auth-panel-stats">
          {[
            { val: '15 min', label: 'Link expires' },
            { val: 'Secure', label: 'Hashed tokens' },
            { val: 'Private', label: 'No enumeration' },
          ].map(s => (
            <div className="auth-stat" key={s.label}>
              <span className="auth-stat-val">{s.val}</span>
              <span className="auth-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel-right">
        <div className="auth-card card fade-in">
          {submitted ? (
            <>
              <div className="auth-card-header" style={{ alignItems: 'center', textAlign: 'center' }}>
                <FiCheckCircle size={48} style={{ color: '#22c55e', marginBottom: '0.75rem' }} />
                <h2>Check your inbox</h2>
                <p>
                  If an account with that email exists, you'll receive a password reset
                  link shortly. It expires in 15 minutes.
                </p>
              </div>
              <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
                <Link to="/login">← Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h2>Forgot password?</h2>
                <p>Enter your email and we'll send you a reset link.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrapper">
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <span className="input-icon" style={{ pointerEvents: 'none' }}>
                      <FiMail size={16} />
                    </span>
                  </div>
                </div>

                {error && <p className="auth-error" style={{ color: '#ef4444' }}>{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" /> Sending…</> : 'Send reset link →'}
                </button>
              </form>

              <hr className="divider" />
              <p className="auth-switch">
                Remember it?{' '}
                <Link to="/login">Sign in instead</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
