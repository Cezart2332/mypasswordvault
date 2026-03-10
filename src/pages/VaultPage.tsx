import { useState, useEffect, useCallback } from 'react';
import AddPasswordModal from '../components/vault/AddPasswordModal';
import { useAuth } from '../context/AuthContext';
import { getUserInfo } from '../services/userService';
import { getVaultItems, deleteVaultItem } from '../services/vaultService';
import { useNavigate } from 'react-router-dom';
import './VaultPage.css';

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthInfo = [
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Fair',   color: '#f5a623' },
  { label: 'Good',   color: '#f5e623' },
  { label: 'Strong', color: '#00d48a' },
];

interface Entry {
  id: number;
  title: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  createdAt: string;
  strength: number;
}

export default function VaultPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const loadEntries = useCallback(async () => {
    try {
      const items = await getVaultItems();
      setEntries(items.map((item: any) => ({
        ...item,
        strength: getStrength(item.password),
      })));
    } catch (err: any) {
      if (err.message === 'Vault locked') {
        logout();
        navigate('/login');
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

  const handleDelete = async (id: number) => {
    await deleteVaultItem(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleCopy = (password: string) => {
    navigator.clipboard.writeText(password);
  };

  const categories = ['All', ...Array.from(new Set(entries.map(e => e.category).filter(Boolean)))];

  const filtered = entries.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.url?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || e.category === activeCategory;
    return matchSearch && matchCat;
  });

  const logOut = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="vault-layout">
      {/* ── SIDEBAR ── */}
      <aside className="vault-sidebar">
        <div className="sidebar-brand">
          <span>🔒</span>
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
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat === 'All' ? '🗂️' : cat === 'Dev' ? '💻' : cat === 'Email' ? '📧' : cat === 'Work' ? '💼' : '🔑'}</span>
              <span>{cat}</span>
              <span className="sidebar-nav-count">
                {cat === 'All' ? entries.length : entries.filter(e => e.category === cat).length}
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
          <button className="btn btn-ghost btn-sm btn-full sidebar-logout" onClick={logOut}>
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="vault-main">
        {/* Top bar */}
        <header className="vault-topbar">
          <div className="vault-topbar-left">
            <h1>{activeCategory === 'All' ? 'All passwords' : activeCategory}</h1>
            <span className="badge badge-blue">{filtered.length} entries</span>
          </div>
          <div className="vault-topbar-right">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search passwords, URLs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <span className="search-clear" onClick={() => setSearch('')}>✕</span>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add password
            </button>
          </div>
        </header>

        {/* Password grid */}
        {loading ? (
          <div className="vault-empty">
            <span className="vault-empty-icon">⏳</span>
            <h3>Loading vault…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vault-empty">
            <span className="vault-empty-icon">🔑</span>
            <h3>No entries found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="vault-grid">
            {filtered.map(entry => (
              <div key={entry.id} className="pw-card card">
                <div className="pw-card-header">
                  <div className="pw-card-avatar">
                    {entry.title[0].toUpperCase()}
                  </div>
                  <div className="pw-card-info">
                    <h3 className="pw-card-title">{entry.title}</h3>
                    <span className="pw-card-url">{entry.url}</span>
                  </div>
                </div>

                <div className="pw-card-body">
                  <div className="pw-card-field">
                    <span className="pw-card-field-label">Category</span>
                    <span className="pw-card-field-value">{entry.category || '—'}</span>
                  </div>
                  <div className="pw-card-field">
                    <span className="pw-card-field-label">Password</span>
                    <span className="pw-card-field-value mono">
                      {revealedId === entry.id ? entry.password : '••••••••••••'}
                    </span>
                  </div>
                </div>

                {/* Strength bar */}
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
                    <button
                      className="btn btn-icon"
                      title="Reveal password"
                      onClick={() => setRevealedId(revealedId === entry.id ? null : entry.id)}
                    >
                      {revealedId === entry.id ? '🙈' : '👁️'}
                    </button>
                    <button
                      className="btn btn-icon"
                      title="Copy password"
                      onClick={() => handleCopy(entry.password)}
                    >
                      📋
                    </button>
                    <button
                      className="btn btn-icon btn-icon-danger"
                      title="Delete"
                      onClick={() => handleDelete(entry.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── ADD PASSWORD MODAL ── */}
      {showModal && (
        <AddPasswordModal
          onClose={() => setShowModal(false)}
          onAdd={loadEntries}
        />
      )}
    </div>
  );
}
