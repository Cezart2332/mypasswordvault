import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield, FiAlertTriangle, FiStar, FiPlus, FiSettings } from 'react-icons/fi';
import { useVault } from '../hooks/useVault';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';
import UnlockVaultModal from '../components/vault/UnlockVaultModal';
import './VaultPage.css';

const strengthInfo = [
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Weak',   color: '#f04a6b' },
  { label: 'Fair',   color: '#f5a623' },
  { label: 'Good',   color: '#f5e623' },
  { label: 'Strong', color: '#00d48a' },
];

export default function DashboardPage() {
  const { entries, loading, isVaultLocked, setIsVaultLocked, loadEntries, toasts, removeToast } = useVault();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const totalEntries = entries.length;
  const strongCount  = entries.filter(e => e.strength === 4).length;
  const weakCount    = entries.filter(e => e.strength <= 1).length;
  const favoriteCount = entries.filter(e => e.isFavorite).length;
  const recentEntries = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const logOut = async () => { await logout(); navigate('/'); };

  return (
    <div className="vault-layout">
      <aside className="vault-sidebar">
        <div className="sidebar-brand"><FiLock size={20} /><span>MyPasswordVault</span></div>
        <div className="sidebar-bottom">
          <Link to="/vault" className="btn btn-ghost btn-sm btn-full sidebar-settings">
            <FiShield size={15} /> Vault
          </Link>
          <Link to="/settings" className="btn btn-ghost btn-sm btn-full sidebar-settings">
            <FiSettings size={15} /> Settings
          </Link>
          <button className="btn btn-ghost btn-sm btn-full sidebar-logout" onClick={logOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="vault-main">
        <header className="vault-topbar">
          <div className="vault-topbar-left">
            <h1>Dashboard</h1>
          </div>
          <div className="vault-topbar-right">
            <Link to="/vault" className="btn btn-primary">
              <FiPlus size={16} /> Go to vault
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="vault-empty"><p>Loading…</p></div>
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total entries', value: totalEntries, icon: <FiShield size={20} />, color: '#60a5fa' },
                { label: 'Strong passwords', value: strongCount, icon: <FiShield size={20} />, color: '#4ade80' },
                { label: 'Weak passwords', value: weakCount, icon: <FiAlertTriangle size={20} />, color: '#f87171' },
                { label: 'Favourites', value: favoriteCount, icon: <FiStar size={20} />, color: '#f5a623' },
              ].map(stat => (
                <div key={stat.label} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Password health breakdown */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Password health</h3>
              {totalEntries === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>No entries yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[4, 3, 2, 1, 0].map(strength => {
                    const count = entries.filter(e => e.strength === strength).length;
                    if (count === 0) return null;
                    const pct = Math.round((count / totalEntries) * 100);
                    return (
                      <div key={strength} title={`${strengthInfo[strength].label}: ${count}`} style={{
                        flex: pct, height: '24px', borderRadius: '4px',
                        background: strengthInfo[strength].color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: '#0c1a2e',
                        minWidth: '24px',
                      }}>
                        {pct >= 10 ? `${pct}%` : ''}
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {[4, 3, 2, 1].map(s => (
                  <span key={s} style={{ fontSize: '0.75rem', color: strengthInfo[s].color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '2px', background: strengthInfo[s].color, display: 'inline-block' }} />
                    {strengthInfo[s].label}
                  </span>
                ))}
              </div>
            </div>

            {/* Recently added */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recently added</h3>
              {recentEntries.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>No entries yet. <Link to="/vault">Add one!</Link></p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Title</th>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Category</th>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Strength</th>
                      <th style={{ paddingBottom: '0.5rem', fontWeight: 500 }}>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEntries.map(e => (
                      <tr key={e.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {e.title}
                          {e.isFavorite && <FiStar size={11} style={{ color: '#f5a623' }} />}
                        </td>
                        <td style={{ padding: '0.6rem 0', color: 'rgba(255,255,255,0.5)' }}>{e.category || '—'}</td>
                        <td style={{ padding: '0.6rem 0', color: strengthInfo[e.strength].color }}>{strengthInfo[e.strength].label}</td>
                        <td style={{ padding: '0.6rem 0', color: 'rgba(255,255,255,0.4)' }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />

      {isVaultLocked && (
        <UnlockVaultModal
          email=""
          onUnlocked={() => { setIsVaultLocked(false); loadEntries(); }}
        />
      )}
    </div>
  );
}

