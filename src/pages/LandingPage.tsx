import { Link } from 'react-router-dom';
import './LandingPage.css';

const features = [
  {
    icon: '🔐',
    title: 'AES-256 Encryption',
    desc: 'Every password is encrypted with military-grade AES-256 before it ever reaches our database.',
  },
  {
    icon: '⚡',
    title: 'Instant Access',
    desc: 'Find any credential in milliseconds with smart search across titles, usernames, and URLs.',
  },
  {
    icon: '🛡️',
    title: 'Zero-Knowledge',
    desc: 'We never see your master password. Only you can decrypt your vault.',
  },
  {
    icon: '🔑',
    title: 'Password Generator',
    desc: 'Generate strong, unique passwords with custom length and character rules.',
  },
  {
    icon: '📂',
    title: 'Organized Vault',
    desc: 'Categorize entries, mark favorites and keep everything structured.',
  },
  {
    icon: '🌐',
    title: 'Secure API',
    desc: 'JWT authenticated REST API ensures only you can access your data.',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="logo-icon">🔒</span>
            <span>MyPasswordVault</span>
          </div>
          <div className="landing-nav-links">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content fade-in">
          <div className="hero-badge badge badge-blue">
            <span>🔒</span> Secure by default
          </div>
          <h1 className="hero-title">
            Your passwords,<br />
            <span className="hero-gradient">locked & loaded.</span>
          </h1>
          <p className="hero-sub">
            A personal password manager built with end-to-end encryption.
            One vault, zero compromises.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Create your vault →
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign in
            </Link>
          </div>
          <p className="hero-note">Free. Open source. Private.</p>
        </div>

        {/* Floating vault preview card */}
        <div className="hero-preview fade-in">
          <div className="preview-card card">
            <div className="preview-header">
              <span className="preview-dot red" />
              <span className="preview-dot yellow" />
              <span className="preview-dot green" />
              <span className="preview-title">My Vault</span>
            </div>
            <div className="preview-search">
              <span className="preview-search-icon">🔍</span>
              <span className="preview-search-text">Search passwords...</span>
            </div>
            {[
              { icon: '🌐', name: 'GitHub', user: 'john@email.com', strength: 4 },
              { icon: '📧', name: 'Gmail', user: 'john@gmail.com', strength: 3 },
              { icon: '💼', name: 'LinkedIn', user: 'john.doe', strength: 4 },
              { icon: '🛒', name: 'Amazon', user: 'john@email.com', strength: 2 },
            ].map((item) => (
              <div className="preview-item" key={item.name}>
                <span className="preview-item-icon">{item.icon}</span>
                <div className="preview-item-info">
                  <span className="preview-item-name">{item.name}</span>
                  <span className="preview-item-user">{item.user}</span>
                </div>
                <div className="preview-strength">
                  {[1,2,3,4].map(i => (
                    <span key={i} className={i <= item.strength ? 'filled' : ''} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="section-inner">
          <div className="section-label">Why MyPasswordVault</div>
          <h2 className="section-title">Built for security. Made for humans.</h2>
          <div className="features-grid">
            {features.map((f) => (
              <div className="feature-card card" key={f.title}>
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="section-inner cta-inner">
          <h2>Ready to secure your digital life?</h2>
          <p>Set up your vault in under a minute.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start for free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <span>© 2026 MyPasswordVault</span>
        <span>Built with React + ASP.NET + PostgreSQL</span>
      </footer>
    </div>
  );
}
