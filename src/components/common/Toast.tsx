import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import './Toast.css';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface Props {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

export default function Toast({ toasts, onRemove }: Props) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastMessage key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastMessage({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
      <span>{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}><FiX size={14} /></button>
    </div>
  );
}
