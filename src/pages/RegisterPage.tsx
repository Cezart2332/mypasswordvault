import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../services/authService';
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

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const strength = getStrength(password);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const username = (document.getElementById('username') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('password') as HTMLInputElement).value;

    try {
      await apiRegister(username, email, pw);
      await login(email, pw); // optional auto-login after registration
      navigate('/vault');
    } catch {
      setError('Could not create account. Please check your details and try again.');
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
          <h2>Your vault starts<br />right here.</h2>
          <p>Create your account and store passwords safely in seconds.</p>
        </div>
        <div className="auth-checklist">
          {[
            'Passwords encrypted before storage',
            'JWT-protected access',
            'Password strength analysis',
            'Built-in password generator',
          ].map(item => (
            <div className="auth-check-item" key={item}>
              <span className="auth-check-icon"><FiCheck size={10} /></span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card card fade-in">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Free. Private. Secure.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Master password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <span className="input-icon" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </span>
              </div>
              {password.length > 0 && (
                <div className="pw-strength">
                  <div className={`strength-bar s${strength}`}>
                    <span /><span /><span /><span />
                  </div>
                  <span className={`strength-label s${strength}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            {error && <p className="auth-error" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Creating vault…</> : 'Create vault →'}
            </button>
          </form>

          <hr className="divider" />

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}