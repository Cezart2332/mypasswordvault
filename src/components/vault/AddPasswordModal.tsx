import { useState } from 'react';
import { FiKey, FiX, FiZap, FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';
import { addVaultItem } from '../../services/vaultService';
import './AddPasswordModal.css';

interface Props {
  onClose: () => void;
  onAdd: () => void;
}

const CHARSETS = {
  uppercase:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase:   'abcdefghijklmnopqrstuvwxyz',
  numbers:     '0123456789',
  symbols:     '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generatePassword(length: number, opts: typeof DEFAULT_OPTS): string {
  let pool = '';
  if (opts.uppercase) pool += CHARSETS.uppercase;
  if (opts.lowercase) pool += CHARSETS.lowercase;
  if (opts.numbers)   pool += CHARSETS.numbers;
  if (opts.symbols)   pool += CHARSETS.symbols;
  if (!pool) pool = CHARSETS.lowercase;

  return Array.from({ length }, () =>
    pool[Math.floor(Math.random() * pool.length)]
  ).join('');
}

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
const strengthMeta = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#f04a6b', '#f5a623', '#f5e623', '#00d48a'];

const DEFAULT_OPTS = { uppercase: true, lowercase: true, numbers: true, symbols: false };

export default function AddPasswordModal({ onClose, onAdd }: Props) {
  // Form fields
  const [title, setTitle]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl]           = useState('');
  const [notes, setNotes]       = useState('');
  const [category, setCategory] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [showPw, setShowPw]     = useState(false);

  // Generator
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength]         = useState(16);
  const [genOpts, setGenOpts]             = useState(DEFAULT_OPTS);
  const [genPreview, setGenPreview]       = useState(() => generatePassword(16, DEFAULT_OPTS));

  const strength = getStrength(password);

  const regenerate = (len = genLength, opts = genOpts) => {
    const pw = generatePassword(len, opts);
    setGenPreview(pw);
  };
  const useGenerated = () => {
    setPassword(genPreview);
    setShowPw(true);
    setShowGenerator(false);
  };

  const toggleOpt = (key: keyof typeof DEFAULT_OPTS) => {
    const next = { ...genOpts, [key]: !genOpts[key] };
    setGenOpts(next);
    regenerate(genLength, next);
  };

  // TODO: wire to vaultService.create()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVaultItem({ title, password, url, notes, category });
      onAdd();
      onClose();
    } catch (err) {
      console.error('Failed to add vault item', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal add-pw-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <FiKey size={20} className="modal-title-icon" />
            <h3>Add password</h3>
          </div>
          <button className="btn btn-icon" onClick={onClose}><FiX size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Row 1 */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="m-title">Title *</label>
              <input id="m-title" placeholder="e.g. GitHub" required value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="m-cat">Category</label>
              <input id="m-cat" placeholder="e.g. Work" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="m-user">Username / Email</label>
            <input id="m-user" placeholder="you@example.com" value={username} onChange={e => setUsername(e.target.value)} />
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="pw-label-row">
              <label htmlFor="m-pw">Password *</label>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowGenerator(g => !g)}
              >
                <FiZap size={13} /> {showGenerator ? 'Hide' : 'Generate'}
              </button>
            </div>
            <div className="input-wrapper">
              <input
                id="m-pw"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter or generate a password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mono"
              />
              <span className="input-icon" onClick={() => setShowPw(p => !p)}>
                {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </span>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="pw-strength-row">
                <div className={`strength-bar s${strength}`}>
                  <span /><span /><span /><span />
                </div>
                <span style={{ color: strengthColor[strength], fontSize: '0.75rem', fontWeight: 600 }}>
                  {strengthMeta[strength]}
                </span>
              </div>
            )}
          </div>

          {/* ── PASSWORD GENERATOR PANEL ── */}
          {showGenerator && (
            <div className="gen-panel">
              <div className="gen-header">
                <span className="gen-preview mono">{genPreview}</span>
                <div className="gen-header-actions">
                  <button type="button" className="btn btn-icon" title="Regenerate" onClick={() => regenerate()}><FiRefreshCw size={15} /></button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={useGenerated}>Use this</button>
                </div>
              </div>

              <div className="gen-length-row">
                <label>Length: <strong>{genLength}</strong></label>
                <input
                  type="range" min={8} max={64}
                  value={genLength}
                  onChange={e => { const n = +e.target.value; setGenLength(n); regenerate(n); }}
                  className="gen-slider"
                />
              </div>

              <div className="gen-opts">
                {(Object.keys(DEFAULT_OPTS) as (keyof typeof DEFAULT_OPTS)[]).map(key => (
                  <label key={key} className="gen-opt">
                    <input
                      type="checkbox"
                      checked={genOpts[key]}
                      onChange={() => toggleOpt(key)}
                    />
                    <span className="gen-opt-check" />
                    <span className="gen-opt-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                    <span className="gen-opt-example">
                      {key === 'uppercase' ? 'A–Z' : key === 'lowercase' ? 'a–z' : key === 'numbers' ? '0–9' : '!@#…'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* URL */}
          <div className="form-group">
            <label htmlFor="m-url">Website URL</label>
            <input id="m-url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="m-notes">Notes</label>
            <textarea id="m-notes" placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Favorite toggle */}
          <label className="fav-toggle">
            <div className={`fav-switch ${favorite ? 'on' : ''}`} onClick={() => setFavorite(f => !f)}>
              <div className="fav-switch-thumb" />
            </div>
            <span>Mark as favorite</span>
          </label>

          <hr className="divider" />

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save password</button>
          </div>
        </form>
      </div>
    </div>
  );
}
