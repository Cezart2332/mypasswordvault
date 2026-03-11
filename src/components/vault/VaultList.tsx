import { useState } from 'react';
import VaultEntryCard from './VaultEntryCard';
import type { VaultEntry } from '../../hooks/useVault';

interface Props {
  entries: VaultEntry[];
  copyId: number | null;
  onCopy: (id: number, password: string) => void;
  onEdit: (entry: VaultEntry) => void;
  onDelete: (id: number) => void;
}

export default function VaultList({ entries, copyId, onCopy, onEdit, onDelete }: Props) {
  const [revealedId, setRevealedId] = useState<number | null>(null);

  return (
    <div className="vault-grid">
      {entries.map(entry => (
        <VaultEntryCard
          key={entry.id}
          entry={entry}
          revealed={revealedId === entry.id}
          copied={copyId === entry.id}
          onToggleReveal={() => setRevealedId(revealedId === entry.id ? null : entry.id)}
          onCopy={() => onCopy(entry.id, entry.password)}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}

