import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import Icon from './Icon';
import Tilt from './Tilt';

export default function ProtectedRoute({ children, title = 'Protected Area' }) {
  const { user, authLoading, authOpen, setAuthOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthOpen(true);
    }
  }, [authLoading, user, location.pathname, setAuthOpen]);

  if (authLoading) {
    return (
      <div className="page narrow">
        <section className="card empty-hero">
          <p className="muted">Verifying Supabase Auth session…</p>
        </section>
      </div>
    );
  }

  // Strictly block access to Activity and Settings if not signed in
  if (!user) {
    return (
      <div className="page narrow">
        <Tilt className="card empty-hero wow-border-beam" maxTilt={8} scale={1.01} glare={true}>
          <div className="locked-icon-ring">
            <Icon name="lock" size={28} />
          </div>
          <span className="sev sev-critical">Mandatory Sign-In Required</span>
          <h2 className="bs-display-4 bs-text-gradient" style={{ marginTop: 8 }}>
            {title} is Locked
          </h2>
          <p className="muted" style={{ maxWidth: '42ch' }}>
            You must sign in with your <strong>Supabase Auth</strong> account to access <strong>{title}</strong>.
          </p>
          <div className="btn-row center" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAuthOpen(true)}
            >
              <Icon name="user" size={16} />
              Sign in to unlock
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate('/app/scanner')}
            >
              Back to Scanner
            </button>
          </div>
        </Tilt>
      </div>
    );
  }

  return children;
}
