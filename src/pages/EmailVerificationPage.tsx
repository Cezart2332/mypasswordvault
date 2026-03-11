import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { resendVerificationEmail, verifyEmail } from '../services/authService';
import './AuthPage.css';
import './EmailVerificationPage.css';

const COOLDOWN_SECONDS = 300; // 5 minutes
const STORAGE_KEY = 'emailVerification_lastSent';

function getRemainingSeconds(): number {
  const lastSent = localStorage.getItem(STORAGE_KEY);
  if (!lastSent) return 0;
  const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
  return Math.max(0, COOLDOWN_SECONDS - elapsed);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Token confirmation view (user clicked link in email) ─────────────────────
function ConfirmTokenView({ token }: { token: string }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-panel-right">
      <div className="auth-card card fade-in ev-card">
        {status === 'loading' && (
          <>
            <div className="ev-icon-wrap ev-icon-loading">
              <FiMail size={28} />
            </div>
            <div className="auth-card-header ev-header">
              <h2>Verifying…</h2>
              <p>Please wait while we confirm your email.</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="ev-icon-wrap ev-icon-success">
              <FiCheck size={28} />
            </div>
            <div className="auth-card-header ev-header">
              <h2>Email verified!</h2>
              <p>Your account is now active. You can sign in.</p>
            </div>
            <button
              className="btn btn-primary ev-resend-btn"
              onClick={() => navigate('/login')}
            >
              Go to sign in
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="ev-icon-wrap ev-icon-error">
              <FiAlertCircle size={28} />
            </div>
            <div className="auth-card-header ev-header">
              <h2>Link expired</h2>
              <p>This verification link is invalid or has expired.</p>
            </div>
            <p className="ev-hint">
              Request a new link from the sign-in page, or register again if your account is no longer active.
            </p>
            <div className="auth-switch ev-footer">
              <Link to="/login">← Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Check-inbox view (redirect from register / login) ───────────────────────
export default function EmailVerificationPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [remaining, setRemaining] = useState(getRemainingSeconds);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Tick the countdown every second
  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(r => {
        const next = r - 1;
        if (next <= 0) clearInterval(interval);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const handleResend = async () => {
    if (remaining > 0 || sending) return;
    setSending(true);
    setError('');
    setSent(false);
    try {
      await resendVerificationEmail(email);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setRemaining(COOLDOWN_SECONDS);
      setSent(true);
    } catch {
      setError('Failed to resend the email. Please try again later.');
    } finally {
      setSending(false);
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
          <h2>Almost<br />there.</h2>
          <p>Verify your email to activate your vault and keep your account secure.</p>
        </div>
        <div className="auth-checklist">
          {[
            'Check your inbox',
            'Look in your spam folder too',
            'Verification link expires in 15 minutes',
            'Contact support if you need help',
          ].map(item => (
            <div className="auth-check-item" key={item}>
              <span className="auth-check-icon"><FiCheck size={10} /></span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — switches between "check inbox" and token confirmation */}
      {token
        ? <ConfirmTokenView token={token} />
        : (
          <div className="auth-panel-right">
            <div className="auth-card card fade-in ev-card">

              <div className="ev-icon-wrap">
                <FiMail size={28} />
              </div>

              <div className="auth-card-header ev-header">
                <h2>Check your email</h2>
                <p>We sent a verification link to</p>
                {email
                  ? <span className="ev-email">{email}</span>
                  : <span className="ev-email ev-email-unknown">your email address</span>
                }
              </div>

              <p className="ev-hint">
                Click the link in the email to activate your account.
                If you don't see it, <strong>check your spam or junk folder</strong>.
              </p>

              {sent && (
                <div className="ev-feedback ev-feedback--success">
                  Email sent! Check your inbox and spam folder.
                </div>
              )}
              {error && (
                <div className="ev-feedback ev-feedback--error">
                  {error}
                </div>
              )}

              {remaining > 0 && (
                <div className="ev-timer-row">
                  <span className="ev-timer-label">Next resend available in</span>
                  <span className="ev-timer">{formatTime(remaining)}</span>
                </div>
              )}

              <button
                className="btn btn-primary ev-resend-btn"
                onClick={handleResend}
                disabled={remaining > 0 || sending}
              >
                <FiRefreshCw size={15} className={sending ? 'ev-spin' : ''} />
                {sending
                  ? 'Sending…'
                  : remaining > 0
                    ? `Resend available in ${formatTime(remaining)}`
                    : 'Resend verification email'}
              </button>

              <div className="auth-switch ev-footer">
                <Link to="/login">← Back to sign in</Link>
              </div>

            </div>
          </div>
        )
      }
    </div>
  );
}

