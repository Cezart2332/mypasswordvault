import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiLock, FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { verifyEmailChange } from '../services/userService';
import './AuthPage.css';
import './EmailVerificationPage.css';

export default function VerifyEmailChangePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    verifyEmailChange(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-layout">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <FiLock size={28} />
          <span>MyPasswordVault</span>
        </div>
        <p className="auth-tagline">Zero-knowledge password security.</p>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card card fade-in ev-card">
          {status === 'loading' && (
            <>
              <div className="ev-icon-wrap ev-icon-loading"><FiMail size={28} /></div>
              <div className="auth-card-header ev-header">
                <h2>Updating email…</h2>
                <p>Please wait while we confirm your new email address.</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="ev-icon-wrap ev-icon-success"><FiCheck size={28} /></div>
              <div className="auth-card-header ev-header">
                <h2>Email updated!</h2>
                <p>Your email address has been changed successfully. Please sign in again.</p>
              </div>
              <Link to="/login" className="btn btn-primary ev-resend-btn">Go to sign in</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="ev-icon-wrap ev-icon-error"><FiAlertCircle size={28} /></div>
              <div className="auth-card-header ev-header">
                <h2>Link expired</h2>
                <p>This verification link is invalid or has expired. Please request a new one from Settings.</p>
              </div>
              <Link to="/settings" className="btn btn-ghost ev-resend-btn">Back to settings</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
