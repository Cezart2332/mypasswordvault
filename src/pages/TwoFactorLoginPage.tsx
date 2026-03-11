import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLock, FiShield } from 'react-icons/fi';
import { completeTwoFactorLogin, loginWithBackupCode } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';
import './TwoFactorLoginPage.css';

export default function TwoFactorLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const state = location.state as { pendingToken: string; vaultKey: CryptoKey } | null;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if arrived without state
  if (!state?.pendingToken) {
    navigate('/login', { replace: true });
    return null;
  }

  const fullCode = code.join('');

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const data = await completeTwoFactorLogin(state.pendingToken, fullCode, state.vaultKey);
      loginWithToken(data.token);
      navigate('/vault');
    } catch {
      setError('Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupCode.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await loginWithBackupCode(state.pendingToken, backupCode.trim().toUpperCase(), state.vaultKey);
      loginWithToken(data.token);
      navigate('/vault');
    } catch {
      setError('Invalid or already-used backup code. Please try again.');
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-bg-glow" />

      <div className="auth-panel-left">
        <Link to="/" className="auth-brand">
          <FiLock size={20} className="auth-brand-icon" />
          <span>MyPasswordVault</span>
        </Link>
        <div className="auth-panel-tagline">
          <h2>Two-factor<br />authentication.</h2>
          <p>Verify your identity to access your vault.</p>
        </div>
        <div className="auth-panel-stats">
          {[
            { val: 'TOTP', label: 'Method' },
            { val: '30s', label: 'Window' },
            { val: '6-digit', label: 'Code' },
          ].map(s => (
            <div className="auth-stat" key={s.label}>
              <span className="auth-stat-val">{s.val}</span>
              <span className="auth-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card card fade-in">
          <div className="auth-card-header">
            <div className="tfa-login-icon">
              <FiShield size={28} />
            </div>
            <h2>Verify your identity</h2>
            <p>{useBackup ? 'Enter one of your backup codes' : 'Enter the 6-digit code from your authenticator app'}</p>
          </div>

          {!useBackup ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="tfa-code-row" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    className="tfa-digit-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || fullCode.length < 6}
              >
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleBackupSubmit}>
              <div className="form-group">
                <label htmlFor="backup-code">Backup code</label>
                <input
                  id="backup-code"
                  type="text"
                  placeholder="e.g. A3B9KL"
                  value={backupCode}
                  onChange={e => setBackupCode(e.target.value.toUpperCase())}
                  autoFocus
                  autoComplete="off"
                  className="mono"
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading || !backupCode.trim()}
              >
                {loading ? 'Verifying…' : 'Sign in with backup code'}
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-link"
              onClick={() => { setUseBackup(u => !u); setError(''); setBackupCode(''); setCode(['', '', '', '', '', '']); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline', padding: 0 }}
            >
              {useBackup ? '← Use authenticator app instead' : "Can't access your authenticator? Use a backup code"}
            </button>
          </p>

          <p className="auth-switch">
            <Link to="/login">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
