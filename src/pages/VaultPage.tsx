import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiLock, FiGrid, FiCode, FiMail, FiBriefcase, FiKey,
  FiLogOut, FiSearch, FiX, FiPlus, FiLoader, FiInbox, FiSettings, FiStar, FiMenu,
} from 'react-icons/fi';
import AddPasswordModal from '../components/vault/AddPasswordModal';
import UnlockVaultModal from '../components/vault/UnlockVaultModal';
import VaultList from '../components/vault/VaultList';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { getUserInfo } from '../services/userService';
import { getVaultItems, deleteVaultItem } from '../services/vaultService';
import './VaultPage.css';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

interface Entry {
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

export default function VaultPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [copyId, setCopyId] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();

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
  }, [logout, navigate]);

  useEffect(() => {
    getUserInfo().then(data => {
      setUsername(data.username);
      setEmail(data.email);
    });
    loadEntries();
  }, [loadEntries]);

  const confirmDelete = (id: number) => setDeletingId(id);

  const handleDelete = async () => {
    if (deletingId === null) return;
    setDeletingLoading(true);
    try {
      await deleteVaultItem(deletingId);
      setEntries(prev => prev.filter(e => e.id !== deletingId));
      addToast('Password deleted', 'success');
    } catch {
      addToast('Failed to delete password', 'error');
    } finally {
      setDeletingLoading(false);
      setDeletingId(null);
    }
  };

  const handleCopy = async (id: number, password: string) => {
    await navigator.clipboard.writeText(password);
    setCopyId(id);
    addToast('Password copied to clipboard', 'success');
    setTimeout(() => setCopyId(null), 2000);
  };

  const categories = ['All', 'Favorites', ...Array.from(new Set(entries.map(e => e.category).filter(Boolean)))];

  const filtered = entries.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.url?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' ||
      (activeCategory === 'Favorites' ? e.isFavorite : e.category === activeCategory);
    return matchSearch && matchCat;
  });

  const logOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="vault-layout">
      {/* ── SIDEBAR BACKDROP (mobile) ── */}
      {mobileSidebarOpen && (
        <div className="vault-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`vault-sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}>
        <button
          className="sidebar-mobile-close"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <FiX size={20} />
        </button>
        <div className="sidebar-brand">
          <FiLock size={20} />
          <span>MyPasswordVault</span>
        </div>

        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <span className="sidebar-stat-num">{entries.length}</span>
            <span className="sidebar-stat-lbl">Total</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-num">{entries.filter(e => e.strength === 4).length}</span>
            <span className="sidebar-stat-lbl">Strong</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-num">{entries.filter(e => e.strength <= 1).length}</span>
            <span className="sidebar-stat-lbl">Weak</span>
          </div>
        </div>

        <hr className="divider" />

        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">Categories</p>
          {categories.map(cat => (
            <button
              key={cat}
              className={`sidebar-nav-item ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); setMobileSidebarOpen(false); }}
            >
              <span className="sidebar-nav-icon">
                {cat === 'All' ? <FiGrid size={14} /> : cat === 'Favorites' ? <FiStar size={14} /> : cat === 'Dev' ? <FiCode size={14} /> : cat === 'Email' ? <FiMail size={14} /> : cat === 'Work' ? <FiBriefcase size={14} /> : <FiKey size={14} />}
              </span>
              <span>{cat}</span>
              <span className="sidebar-nav-count">
                {cat === 'All' ? entries.length : cat === 'Favorites' ? entries.filter(e => e.isFavorite).length : entries.filter(e => e.category === cat).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{username ? username[0].toUpperCase() : '?'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{username || '…'}</span>
              <span className="sidebar-user-email">{email || '…'}</span>
            </div>
          </div>
          <Link to="/settings" className="btn btn-ghost btn-sm btn-full sidebar-settings">
            <FiSettings size={15} /> Security settings
          </Link>
          <button className="btn btn-ghost btn-sm btn-full sidebar-logout" onClick={logOut}>
            <FiLogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="vault-main">
        {/* Top bar */}
        <header className="vault-topbar">
          <div className="vault-topbar-left">
            <button
              className="btn-hamburger"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu size={22} />
            </button>
            <h1>{activeCategory === 'All' ? 'All passwords' : activeCategory}</h1>
            <span className="badge badge-blue">{filtered.length} entries</span>
          </div>
          <div className="vault-topbar-right">
            <div className="search-box">
              <FiSearch size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search passwords, URLs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <span className="search-clear" onClick={() => setSearch('')}><FiX size={13} /></span>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingEntry(null); setShowModal(true); }}>
              <FiPlus size={16} /> <span className="btn-add-text">Add password</span>
            </button>
          </div>
        </header>

        {/* Password grid */}
        {loading ? (
          <div className="vault-empty">
            <FiLoader size={48} className="vault-empty-icon spin" />
            <h3>Loading vault…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vault-empty">
            <FiInbox size={48} className="vault-empty-icon" />
            <h3>No entries found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <VaultList
            entries={filtered}
            copyId={copyId}
            onCopy={handleCopy}
            onEdit={entry => { setEditingEntry(entry); setShowModal(true); }}
            onDelete={confirmDelete}
          />
        )}
      </main>

      {/* ── ADD PASSWORD MODAL ── */}
      {showModal && (
        <AddPasswordModal
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onAdd={loadEntries}
          onSuccess={msg => addToast(msg, 'success')}
          onError={msg => addToast(msg, 'error')}
          entry={editingEntry ?? undefined}
        />
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {deletingId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this password? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
          loading={deletingLoading}
        />
      )}

      {/* ── TOASTS ── */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {isVaultLocked && (
        <UnlockVaultModal
          email={email}
          onUnlocked={() => { setIsVaultLocked(false); loadEntries(); }}
        />
      )}
    </div>
  );
}
