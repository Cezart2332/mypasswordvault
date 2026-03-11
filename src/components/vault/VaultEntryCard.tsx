import { FiStar, FiEye, FiEyeOff, FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { VaultEntry } from '../../hooks/useVault';

const strengthInfo = [
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Fair',   color: '#f5a623' },
  { label: 'Good',   color: '#f5e623' },
  { label: 'Strong', color: '#00d48a' },
];

interface Props {
  entry: VaultEntry;
  revealed: boolean;
  copied: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VaultEntryCard({ entry, revealed, copied, onToggleReveal, onCopy, onEdit, onDelete }: Props) {
  return (
    <div className="pw-card card">
      <div className="pw-card-header">
        <div className="pw-card-avatar">
          {entry.title ? entry.title[0].toUpperCase() : '?'}
        </div>
        <div className="pw-card-info">
          <h3 className="pw-card-title">
            {entry.title}
            {entry.isFavorite && <FiStar size={12} style={{ marginLeft: '0.4rem', color: '#f5a623', verticalAlign: 'middle' }} />}
          </h3>
          <span className="pw-card-url">{entry.url}</span>
        </div>
      </div>

      <div className="pw-card-body">
        <div className="pw-card-field">
          <span className="pw-card-field-label">Username</span>
          <span className="pw-card-field-value">{entry.username || '—'}</span>
        </div>
        <div className="pw-card-field">
          <span className="pw-card-field-label">Category</span>
          <span className="pw-card-field-value">{entry.category || '—'}</span>
        </div>
        <div className="pw-card-field">
          <span className="pw-card-field-label">Password</span>
          <span className="pw-card-field-value mono">
            {revealed ? entry.password : '••••••••••••'}
          </span>
        </div>
      </div>

      <div className="pw-card-strength">
        <div className="strength-bar-row">
          {[1, 2, 3, 4].map(i => (
            <span
              key={i}
              style={{ background: i <= entry.strength ? strengthInfo[entry.strength].color : 'var(--border)' }}
            />
          ))}
        </div>
        <span className="pw-strength-label" style={{ color: strengthInfo[entry.strength].color }}>
          {strengthInfo[entry.strength].label}
        </span>
      </div>

      <div className="pw-card-footer">
        <span className="pw-card-date">
          {new Date(entry.createdAt).toLocaleDateString()}
        </span>
        <div className="pw-card-actions">
          <button className="btn btn-icon" title="Reveal password" onClick={onToggleReveal}>
            {revealed ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
          <button className="btn btn-icon" title={copied ? 'Copied!' : 'Copy password'} onClick={onCopy}>
            <FiCopy size={15} />
          </button>
          <button className="btn btn-icon" title="Edit" onClick={onEdit}>
            <FiEdit2 size={15} />
          </button>
          <button className="btn btn-icon btn-icon-danger" title="Delete" onClick={onDelete}>
            <FiTrash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

