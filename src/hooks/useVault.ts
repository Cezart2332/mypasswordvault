import { useState, useCallback } from 'react';
import { getVaultItems, deleteVaultItem } from '../services/vaultService';
import { useToast } from './useToast';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export interface VaultEntry {
  id: number;
  title: string;
  password: string;
  username: string;
  url: string;
  notes: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
  strength: number;
}

export function useVault() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [copyId, setCopyId] = useState<number | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadEntries = useCallback(async () => {
    try {
      const items = await getVaultItems();
      setEntries(items.map((item: any) => ({
        ...item,
        strength: getStrength(item.password),
      })));
      setIsVaultLocked(false);
    } catch (err: any) {
      if (err.message === 'Vault locked' || err.message === 'Vault key not found') {
        setIsVaultLocked(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteVaultItem(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      addToast('Password deleted', 'success');
      return true;
    } catch {
      addToast('Failed to delete password', 'error');
      return false;
    }
  }, [addToast]);

  const handleCopy = useCallback(async (id: number, password: string) => {
    await navigator.clipboard.writeText(password);
    setCopyId(id);
    addToast('Password copied to clipboard', 'success');
    setTimeout(() => setCopyId(null), 2000);
  }, [addToast]);

  return {
    entries,
    loading,
    isVaultLocked,
    setIsVaultLocked,
    loadEntries,
    handleDelete,
    handleCopy,
    copyId,
    toasts,
    addToast,
    removeToast,
  };
}
