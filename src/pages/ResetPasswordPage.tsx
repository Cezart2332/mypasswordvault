import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';
import { confirmResetPassword } from '../services/authService';
import './AuthPage.css';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (strength < 2) {
      setError('Please choose a stronger password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmResetPassword(token, password);
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-layout">
        <div className="auth-bg-glow" />
        <div className="auth-panel-right" style={{ justifyContent: 'center', width: '100%' }}>
          <div className="auth-card card fade-in" style={{ textAlign: 'center' }}>
            <FiAlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '0.75rem' }} />
            <h2>Invalid link</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This password reset link is missing a token.
            </p>
            <Link to="/forgot-password" className="btn btn-primary btn-full">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h2>Choose a new<br />master password.</h2>
          <p>Pick something strong that you haven't used elsewhere.</p>
        </div>
        <div className="auth-panel-stats">
          {[
            { val: '600k', label: 'PBKDF2 iters' },
            { val: 'AES-256', label: 'Vault cipher' },
            { val: 'Zero', label: 'Knowledge' },
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
          <div className="auth-card-header">
            <h2>Reset password</h2>
            <p>Enter and confirm your new master password below.</p>
          </div>

          {/* Warning banner */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            marginBottom: '1.25rem',
          }}>
            <FiAlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#fbbf24', lineHeight: 1.5 }}>
              <strong>Your vault will be wiped.</strong> Because your encryption key is derived
              from your master password, all saved vault entries will be permanently deleted
              when you reset.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New master password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </span>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i <= strength ? strengthColor[strength] : 'var(--border)',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: strengthColor[strength] }}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm new password</label>
              <div className="input-wrapper">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat master password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                <span
                  className="input-icon"
                  onClick={() => setShowConfirm(p => !p)}
                  title={showConfirm ? 'Hide' : 'Show'}
                >
                  {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </span>
              </div>
              {mismatch && (
                <span style={{ fontSize: '0.78rem', color: '#ef4444' }}>Passwords do not match</span>
              )}
            </div>

            {error && <p className="auth-error" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || mismatch}
            >
              {loading ? <><span className="spinner" /> Resetting…</> : 'Reset my password →'}
            </button>
          </form>

          <hr className="divider" />
          <p className="auth-switch">
            Remembered it?{' '}
            <Link to="/login">Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
