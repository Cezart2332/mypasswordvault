import { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiX } from 'react-icons/fi';
import { getKdfSalt } from '../../services/authService';
import { deriveKey, cryptoStore } from '../../services/cryptoUtils';
import './AddPasswordModal.css';

interface Props {
  email: string;
  onUnlocked: () => void;
  onCancel?: () => void;
}

export default function UnlockVaultModal({ email, onUnlocked, onCancel }: Props) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const saltBytes = await getKdfSalt(email);
      const key = await deriveKey(password, saltBytes);
      cryptoStore.setVaultKey(key);
      onUnlocked();
    } catch {
      setError('Incorrect master password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal add-pw-modal" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <FiLock size={20} className="modal-title-icon" />
            <h3>Vault locked</h3>
          </div>
          {onCancel && (
            <button className="btn btn-icon modal-close" onClick={onCancel} title="Cancel">
              <FiX size={18} />
            </button>
          )}
        </div>
        <div className="modal-body">
          <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Your session is still active but the vault key was cleared after the page refreshed.
            Re-enter your master password to unlock your vault without logging out.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="unlock-password">Master password</label>
              <div className="input-wrapper">
                <input
                  id="unlock-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your master password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPw(p => !p)}
                  style={{ cursor: 'pointer' }}
                  title={showPw ? 'Hide' : 'Show'}
                >
                  {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </span>
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading || !password}>
                {loading ? <><span className="spinner" /> Unlocking…</> : 'Unlock vault'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
