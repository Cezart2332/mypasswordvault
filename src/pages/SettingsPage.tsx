import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiCheck, FiX, FiChevronLeft, FiAlertTriangle, FiEye, FiEyeOff, FiTrash2, FiRefreshCw, FiCopy, FiKey, FiMail } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { getTwoFactorSetup, enableTwoFactor, disableTwoFactor, regenerateBackupCodes } from '../services/authService';
import { getUserInfo, deleteAccount, changePassword, changeEmail } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';
import './SettingsPage.css';

type View = 'idle' | 'setup-scan' | 'setup-verify' | 'disable-verify' | 'backup-codes' | 'success';

export default function SettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [view, setView] = useState<View>('idle');
  const [setupData, setSetupData] = useState<{ secret: string; qrUri: string } | null>(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Change password state
  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [showCpCurrent, setShowCpCurrent] = useState(false);
  const [showCpNew, setShowCpNew] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');

  // Change email state
  const [ceNewEmail, setCeNewEmail] = useState('');
  const [cePassword, setCePassword] = useState('');
  const [showCePassword, setShowCePassword] = useState(false);
  const [ceLoading, setCeLoading] = useState(false);
  const [ceError, setCeError] = useState('');
  const [ceSuccess, setCeSuccess] = useState('');

  const navigate = useNavigate();
  const { logout } = useAuth();

  const fullCode = code.join('');

  // Load 2FA status from /api/user/me
  useEffect(() => {
    getUserInfo()
      .then(d => {
        setTwoFactorEnabled(!!d.twoFactorEnabled);
        setUserEmail(d.email ?? '');
      })
      .catch(() => {});
  }, []);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTwoFactorSetup();
      setSetupData(data);
      setView('setup-scan');
    } catch {
      setError('Failed to generate setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
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

  const resetCode = () => {
    setCode(['', '', '', '', '', '']);
    setTimeout(() => inputs.current[0]?.focus(), 0);
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const codes = await enableTwoFactor(fullCode);
      setTwoFactorEnabled(true);
      setBackupCodes(codes);
      setView('backup-codes');
      setSetupData(null);
    } catch {
      setError('Invalid code. Please try again.');
      resetCode();
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullCode.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await disableTwoFactor(fullCode);
      setTwoFactorEnabled(false);
      setStatusMsg('Two-factor authentication has been disabled.');
      setView('success');
    } catch {
      setError('Invalid code. Please try again.');
      resetCode();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView('idle');
    setCode(['', '', '', '', '', '']);
    setError('');
    setSetupData(null);
    setBackupCodes([]);
  };

  const handleRegenerateCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const codes = await regenerateBackupCodes();
      setBackupCodes(codes);
      setView('backup-codes');
    } catch {
      setError('Failed to regenerate codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpNew !== cpConfirm) { setCpError('New passwords do not match.'); return; }
    if (cpNew.length < 12) { setCpError('New password must be at least 12 characters.'); return; }
    setCpLoading(true);
    setCpError('');
    setCpSuccess('');
    try {
      await changePassword(userEmail, cpCurrent, cpNew);
      // Vault was wiped server-side. Force complete logout so user re-derives the new key.
      await logout();
      navigate('/login', { state: { message: 'Password changed. Your vault data has been cleared. Please log in with your new password.' } });
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('password')) {
        setCpError('Current password is incorrect.');
      } else {
        setCpError('Failed to change password. Please try again.');
      }
    } finally {
      setCpLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setCeLoading(true);
    setCeError('');
    setCeSuccess('');
    try {
      await changeEmail(userEmail, cePassword, ceNewEmail);
      setCeSuccess(`A verification link has been sent to ${ceNewEmail}. Click it to confirm your new email.`);
      setCeNewEmail('');
      setCePassword('');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? '';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('password')) {
        setCeError('Password is incorrect.');
      } else if (msg.toLowerCase().includes('already in use') || msg.toLowerCase().includes('use')) {
        setCeError('That email is already in use by another account.');
      } else {
        setCeError('Failed to initiate email change. Please try again.');
      }
    } finally {
      setCeLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount(userEmail, deletePassword);
      await logout();
      navigate('/');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect')) {
        setDeleteError('Password is incorrect.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-topbar">
        <Link to="/vault" className="settings-back-link">
          <FiChevronLeft size={18} /> Back to vault
        </Link>
        <div className="settings-brand">
          <FiLock size={18} />
          <span>MyPasswordVault</span>
        </div>
      </div>

      <div className="settings-content">
        <h1 className="settings-title">Security settings</h1>

        <div className="settings-card card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <FiShield size={22} />
            </div>
            <div>
              <h3>Two-factor authentication</h3>
              <p>Add an extra layer of security using an authenticator app.</p>
            </div>
            <span className={`settings-badge ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* ── IDLE ── */}
          {view === 'idle' && (
            <div className="settings-card-body">
              {twoFactorEnabled ? (
                <>
                  <p className="settings-description">
                    Your account is protected with TOTP 2FA. You will need your authenticator app each time you sign in.
                  </p>
                  <div className="settings-actions">
                    <button
                      className="btn btn-ghost"
                      onClick={handleRegenerateCodes}
                      disabled={loading}
                    >
                      <FiRefreshCw size={14} /> {loading ? 'Loading…' : 'New backup codes'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => { setView('disable-verify'); resetCode(); }}
                    >
                      Disable 2FA
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="settings-description">
                    Use Google Authenticator, Authy, or any TOTP app to generate a one-time code at login.
                  </p>
                  <button className="btn btn-primary" onClick={handleStartSetup} disabled={loading}>
                    {loading ? 'Loading…' : 'Enable 2FA'}
                  </button>
                </>
              )}
              {error && <p className="form-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
            </div>
          )}

          {/* ── SCAN QR ── */}
          {view === 'setup-scan' && setupData && (
            <div className="settings-card-body">
              <p className="settings-description">
                Scan this QR code with your authenticator app, then click <strong>Next</strong>.
              </p>
              <div className="settings-qr-wrap">
                <QRCodeSVG
                  value={setupData.qrUri}
                  size={200}
                  bgColor="#0c1a2e"
                  fgColor="#ffffff"
                  level="M"
                />
              </div>
              <details className="settings-secret-details">
                <summary>Can't scan? Enter manually</summary>
                <code className="settings-secret-code">{setupData.secret}</code>
              </details>
              <div className="settings-actions">
                <button className="btn btn-ghost" onClick={handleBack}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { setView('setup-verify'); resetCode(); }}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* ── VERIFY ENABLE ── */}
          {view === 'setup-verify' && (
            <div className="settings-card-body">
              <p className="settings-description">
                Enter the 6-digit code shown in your authenticator app to confirm setup.
              </p>
              <form onSubmit={handleEnable}>
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
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {error && <p className="form-error">{error}</p>}
                <div className="settings-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setView('setup-scan')}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || fullCode.length < 6}>
                    {loading ? 'Verifying…' : 'Confirm & enable'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── VERIFY DISABLE ── */}
          {view === 'disable-verify' && (
            <div className="settings-card-body">
              <p className="settings-description">
                Enter your current authenticator code to confirm disabling 2FA.
              </p>
              <form onSubmit={handleDisable}>
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
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                {error && <p className="form-error">{error}</p>}
                <div className="settings-actions">
                  <button type="button" className="btn btn-ghost" onClick={handleBack}>Cancel</button>
                  <button type="submit" className="btn btn-danger" disabled={loading || fullCode.length < 6}>
                    {loading ? 'Verifying…' : 'Confirm & disable'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── BACKUP CODES ── */}
          {view === 'backup-codes' && (
            <div className="settings-card-body">
              <p className="settings-description">
                <strong>Save these backup codes somewhere safe.</strong> Each can be used once to sign in if you lose access to your authenticator app. These codes will not be shown again.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
                {backupCodes.map((c, i) => (
                  <div key={i} style={{
                    fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                    padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    {c}
                    <FiCopy
                      size={13}
                      style={{ cursor: 'pointer', opacity: 0.6 }}
                      onClick={() => navigator.clipboard.writeText(c)}
                      title="Copy"
                    />
                  </div>
                ))}
              </div>
              <div className="settings-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => navigator.clipboard.writeText(backupCodes.join('\n'))}
                >
                  <FiCopy size={14} /> Copy all
                </button>
                <button className="btn btn-primary" onClick={handleBack}>Done</button>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {view === 'success' && (
            <div className="settings-card-body settings-success">
              <div className="settings-success-icon">
                {twoFactorEnabled ? <FiCheck size={28} /> : <FiX size={28} />}
              </div>
              <p>{statusMsg}</p>
              <button className="btn btn-primary" onClick={handleBack}>Done</button>
            </div>
          )}
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div className="settings-card card" style={{ marginTop: '1.5rem' }}>
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <FiKey size={22} />
            </div>
            <div>
              <h3>Change master password</h3>
              <p>Changing your password will permanently erase all vault data, as it cannot be re-encrypted without the old key.</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.85rem 1rem', borderRadius: '10px',
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
              marginBottom: '1.25rem',
            }}>
              <FiAlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fde68a', lineHeight: 1.5 }}>
                <strong>All vault entries will be deleted.</strong> This app uses zero-knowledge encryption — your vault key is derived from your master password. Changing it means all existing ciphertext becomes unreadable.
              </p>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="cp-current" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Current password</label>
                <div className="input-wrapper">
                  <input id="cp-current" type={showCpCurrent ? 'text' : 'password'} placeholder="Current master password"
                    value={cpCurrent} onChange={e => setCpCurrent(e.target.value)} required autoComplete="current-password" />
                  <span className="input-icon" onClick={() => setShowCpCurrent(p => !p)} style={{ cursor: 'pointer' }}>
                    {showCpCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="cp-new" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>New password</label>
                <div className="input-wrapper">
                  <input id="cp-new" type={showCpNew ? 'text' : 'password'} placeholder="New master password (min 12 chars)"
                    value={cpNew} onChange={e => setCpNew(e.target.value)} required autoComplete="new-password" minLength={12} />
                  <span className="input-icon" onClick={() => setShowCpNew(p => !p)} style={{ cursor: 'pointer' }}>
                    {showCpNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="cp-confirm" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Confirm new password</label>
                <div className="input-wrapper">
                  <input id="cp-confirm" type="password" placeholder="Confirm new password"
                    value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} required autoComplete="new-password" />
                </div>
              </div>
              {cpError && <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{cpError}</p>}
              {cpSuccess && <p style={{ color: '#4ade80', fontSize: '0.875rem', marginBottom: '1rem' }}>{cpSuccess}</p>}
              <button type="submit" className="btn btn-primary"
                disabled={cpLoading || !cpCurrent || !cpNew || !cpConfirm}>
                {cpLoading ? <><span className="spinner" /> Changing…</> : 'Change password'}
              </button>
            </form>
          </div>
        </div>

        {/* ── CHANGE EMAIL ── */}
        <div className="settings-card card" style={{ marginTop: '1.5rem' }}>
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <FiMail size={22} />
            </div>
            <div>
              <h3>Change email address</h3>
              <p>A verification link will be sent to the new address. Your email will only be updated after you click it.</p>
            </div>
          </div>
          <div className="settings-card-body">
            <form onSubmit={handleChangeEmail}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="ce-email" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>New email address</label>
                <div className="input-wrapper">
                  <input id="ce-email" type="email" placeholder="New email address"
                    value={ceNewEmail} onChange={e => setCeNewEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="ce-password" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Confirm with master password</label>
                <div className="input-wrapper">
                  <input id="ce-password" type={showCePassword ? 'text' : 'password'} placeholder="Your current master password"
                    value={cePassword} onChange={e => setCePassword(e.target.value)} required autoComplete="current-password" />
                  <span className="input-icon" onClick={() => setShowCePassword(p => !p)} style={{ cursor: 'pointer' }}>
                    {showCePassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </span>
                </div>
              </div>
              {ceError && <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{ceError}</p>}
              {ceSuccess && <p style={{ color: '#4ade80', fontSize: '0.875rem', marginBottom: '1rem' }}>{ceSuccess}</p>}
              <button type="submit" className="btn btn-primary"
                disabled={ceLoading || !ceNewEmail || !cePassword}>
                {ceLoading ? <><span className="spinner" /> Sending…</> : 'Send verification link'}
              </button>
            </form>
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="settings-card card" style={{ marginTop: '1.5rem', borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className="settings-card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.15)' }}>
            <div className="settings-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <FiTrash2 size={22} />
            </div>
            <div>
              <h3>Delete account</h3>
              <p>Permanently delete your account and all saved passwords. This cannot be undone.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              marginBottom: '1.25rem',
            }}>
              <FiAlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>
                <strong>This is irreversible.</strong> All vault entries, settings, and account data will
                be permanently erased. You will be signed out immediately.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="delete-password" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                  Confirm your master password
                </label>
                <div className="input-wrapper">
                  <input
                    id="delete-password"
                    type={showDeletePassword ? 'text' : 'password'}
                    placeholder="Enter your master password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <span
                    className="input-icon"
                    onClick={() => setShowDeletePassword(p => !p)}
                    title={showDeletePassword ? 'Hide' : 'Show'}
                    style={{ cursor: 'pointer' }}
                  >
                    {showDeletePassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', marginBottom: '1.25rem', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.checked)}
                  style={{ accentColor: '#ef4444', width: '15px', height: '15px' }}
                />
                I understand this will permanently delete my account and all vault data.
              </label>

              {deleteError && (
                <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{deleteError}</p>
              )}

              <button
                type="submit"
                className="btn btn-danger"
                disabled={deleteLoading || !deleteConfirm || !deletePassword}
              >
                {deleteLoading ? <><span className="spinner" /> Deleting…</> : 'Delete my account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
