import Icon from '../components/Icon';
import HoldButton from '../components/HoldButton';
import SloshGauge from '../components/SloshGauge';
import { useApp } from '../state/AppContext';
import { REDACTION_MODES } from '../lib/scanner';
import { API_BASE } from '../lib/api';
import { LANGUAGES } from '../lib/i18n';

export default function Settings() {
  const { theme, setTheme, lang, setLang, settings, updateSettings, backend, checkHealth, user, setAuthOpen, logout, history, seedDemo, clearHistory } = useApp();

  const apiLine = backend.state === 'online'
    ? `Online · ${backend.persistence === 'supabase' ? 'Supabase storage' : 'demo memory storage'} · ${backend.ai ? 'Gemini connected' : 'no Gemini key (local fallback)'}`
    : backend.state === 'checking' ? 'Checking…' : 'Offline. The scanner still works; sign-in and AI assist need the API.';

  return (
    <div className="page narrow">
      <header className="page-head"><div><h1>Settings</h1><p className="muted">Preferences are saved in this browser.</p></div></header>

      <section className="card">
        <div className="card-head"><h2>Appearance &amp; Language</h2></div>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {['light', 'dark'].map((t) => (
            <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>
              <Icon name={t === 'light' ? 'sun' : 'moon'} size={14} />{t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="toggle-row" style={{ marginTop: 14 }}>
          <div><strong>Preferred Regional Language</strong><span className="muted">Used for UI labels, voice dictation, spoken audio summaries, and Gemini AI explanations.</span></div>
          <label className="lang-select">
            <Icon name="globe" size={15} />
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Preferred language">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
              ))}
            </select>
          </label>
        </div>
        <div className="toggle-row" style={{ marginTop: 14 }}>
          <div><strong>Screen Brightness (SloshGauge)</strong><span className="muted">Drag the liquid gauge up or down to adjust screen brightness ({settings.brightness ?? 100}%).</span></div>
          <SloshGauge
            value={settings.brightness ?? 100}
            onChange={(v) => updateSettings({ brightness: Math.max(25, v) })}
            interactive={true}
            width={72}
            height={140}
            radius={16}
            liquidColor="#A855F7"
            glassColor={theme === 'dark' ? '#27272a' : '#e4e4e7'}
            ariaLabel="Screen brightness"
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Redaction</h2></div>
        <p className="muted">Default style for the safe prompt.</p>
        <div className="option-list">
          {Object.entries(REDACTION_MODES).map(([id, m]) => (
            <label key={id} className={`option ${settings.mode === id ? 'on' : ''}`}>
              <input type="radio" name="mode" checked={settings.mode === id} onChange={() => updateSettings({ mode: id })} />
              <strong>{m.label}</strong><span className="muted">{m.hint}</span>
            </label>
          ))}
        </div>
        <label className="toggle-row">
          <div><strong>AI assist</strong><span className="muted">Show explain and rewrite tools in the scanner. Only counts or already-redacted text are sent.</span></div>
          <span className="switch"><input type="checkbox" checked={settings.aiEnabled} onChange={(e) => updateSettings({ aiEnabled: e.target.checked })} /><i /></span>
        </label>
      </section>

      <section className="card">
        <div className="card-head"><h2>Account</h2></div>
        {user ? (
          <div className="toggle-row"><div><strong>{user.name}</strong><span className="muted">{user.email}</span></div><button className="btn" onClick={logout}><Icon name="logout" size={16} />Sign out</button></div>
        ) : (
          <div className="toggle-row"><div><strong>Guest</strong><span className="muted">Sign in to sync scan counts across devices.</span></div><button className="btn btn-primary" onClick={() => setAuthOpen(true)}>Sign in</button></div>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h2>Connection</h2><button className="btn btn-sm" onClick={checkHealth}>Recheck</button></div>
        <dl className="kv">
          <dt>API address</dt><dd><code>{API_BASE}</code></dd>
          <dt>Status</dt><dd><span className={`status-dot ${backend.state === 'online' ? 'ok' : ''}`}>{apiLine}</span></dd>
        </dl>
        <p className="muted tiny">Change the address with <code>VITE_API_BASE_URL</code> in <code>frontend/.env</code>. Keep the Gemini and Supabase service keys in the backend only.</p>
      </section>

      <section className="card">
        <div className="card-head"><h2>Data</h2></div>
        <div className="toggle-row">
          <div><strong>{history.length} saved scans</strong><span className="muted">Counts and categories only.</span></div>
          <div className="btn-row">
            <button className="btn" onClick={seedDemo}>Add demo data</button>
            <HoldButton
              size="sm"
              holdTime={1400}
              fillColor="#ef4444"
              disabled={!history.length}
              icon={<Icon name="trash" size={14} />}
              doneIcon={<Icon name="check" size={14} />}
              doneLabel="Deleted"
              onHold={() => clearHistory()}
            >
              Hold to delete
            </HoldButton>
          </div>
        </div>
      </section>
    </div>
  );
}
