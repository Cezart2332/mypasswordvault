import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmDialog.css';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ message, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && !loading) onCancel(); }}>
      <div className="modal confirm-dialog">
        <div className="modal-header">
          <div className="modal-title-group">
            <FiAlertTriangle size={18} className="confirm-icon" />
            <h3>Confirm delete</h3>
          </div>
          <button className="btn btn-icon" onClick={onCancel} disabled={loading}><FiX size={17} /></button>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
