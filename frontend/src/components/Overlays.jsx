import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import Icon from './Icon';
import { LogoMark } from './Logo';

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <Icon name={t.tone === 'error' ? 'alert' : 'check'} size={16} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function AuthModal() {
  const { authOpen, setAuthOpen, authenticate, user } = useApp();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isMandatoryRoute = !user && (location.pathname.startsWith('/app/activity') || location.pathname.startsWith('/app/settings'));

  const closeModal = () => {
    setAuthOpen(false);
    // If the user closes the popup on a mandatory route (Activity or Settings), take them back out to Scanner
    if (isMandatoryRoute) {
      navigate('/app/scanner', { replace: true });
    }
  };

  useEffect(() => {
    if (!authOpen) return undefined;
    setError('');
    const t = setTimeout(() => first.current?.focus(), 30);
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [authOpen, mode]);

  if (!authOpen) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authenticate(mode, form);
      setForm({ name: '', email: '', password: '' });
      setAuthOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <form
        className="modal wow-border-beam"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          aria-label="Close login popup"
          title="Close (Esc)"
          onClick={closeModal}
        >
          <Icon name="x" size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={32} />
          <span className={`sev ${isMandatoryRoute ? 'sev-critical' : 'sev-low'}`}>
            {isMandatoryRoute ? 'Sign-In Required for this Page' : 'Supabase Auth'}
          </span>
        </div>

        <h2 id="auth-title" className="bs-text-gradient" style={{ marginTop: 12 }}>
          {mode === 'login' ? 'Sign in to PromptShield' : 'Create your account'}
        </h2>
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          {isMandatoryRoute
            ? 'Activity & Settings require an account. Sign in below, or click ✕ to return to the Scanner.'
            : 'Sync your scan activity across devices. Raw prompts never leave your browser.'}
        </p>

        {mode === 'register' && (
          <label className="field">
            <span>Name</span>
            <input
              ref={first}
              value={form.name}
              onChange={set('name')}
              required
              minLength={2}
              autoComplete="name"
              placeholder="Your name"
            />
          </label>
        )}

        <label className="field">
          <span>Email</span>
          <input
            ref={mode === 'login' ? first : undefined}
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={8}
            placeholder="At least 8 characters"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {error && (
          <div className="form-error" role="alert">
            <Icon name="alert" size={15} />
            {error}
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="link-btn"
            style={{ margin: 0 }}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={closeModal}
          >
            ✕ Exit to Scanner
          </button>
        </div>
      </form>
    </div>
  );
}
