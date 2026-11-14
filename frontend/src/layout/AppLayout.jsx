import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import LineSidebar from '../components/LineSidebar';
import WebThreads from '../components/WebThreads';
import SloshGauge from '../components/SloshGauge';
import { CursorSpotlight } from '../components/WowEffects';
import { useApp } from '../state/AppContext';
import { LANGUAGES, t } from '../lib/i18n';

const NAV = [
  { to: '/app', end: true, key: 'overview', icon: 'grid' },
  { to: '/app/scanner', key: 'scanner', icon: 'scan' },
  { to: '/app/activity', key: 'activity', icon: 'activity', protected: true },
  { to: '/app/rules', key: 'detectors', icon: 'sliders' },
  { to: '/app/settings', key: 'settings', icon: 'settings', protected: true },
];

function BackendChip() {
  const { backend, checkHealth } = useApp();
  const label = backend.state === 'online' ? 'API online' : backend.state === 'checking' ? 'Checking API' : 'API offline';
  const hint = backend.state === 'online'
    ? `${backend.persistence === 'supabase' ? 'Supabase' : 'Demo memory'} storage · ${backend.ai ? 'Gemini on' : 'Gemini off'}`
    : 'Scanning still works offline. Click to retry.';
  return (
    <button className={`status-chip ${backend.state}`} onClick={checkHealth} title={hint}>
      <i />{label}
    </button>
  );
}

export default function AppLayout() {
  const { theme, setTheme, lang, setLang, settings, updateSettings, user, setAuthOpen, logout } = useApp();
  const [navOpen, setNavOpen] = useState(false);
  const [brightOpen, setBrightOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => { setNavOpen(false); window.scrollTo(0, 0); }, [pathname]);

  const activeIndex = NAV.findIndex((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  const navLabels = NAV.map((n) => `${t(lang, n.key)}${n.protected && !user ? ' 🔒' : ''}`);
  const brightness = settings.brightness ?? 100;

  return (
    <div className="shell" style={{ position: 'relative' }}>
      <CursorSpotlight />
      <div className="threads-bg" aria-hidden="true">
        <WebThreads
          colors={theme === 'dark' ? ['#5227FF', '#FF9FFC', '#00E5FF'] : ['#5227FF', '#A855F7']}
          lightMode={theme === 'light'}
          opacity={theme === 'dark' ? 0.24 : 0.16}
          threadCount={6}
          speed={0.18}
          mouseInteraction={true}
          pulseOnClick={true}
        />
      </div>

      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-logo" aria-label="PromptShield home"><Logo /></Link>
        <div className="sidebar-line-wrap">
          <LineSidebar
            items={navLabels}
            activeIndex={activeIndex >= 0 ? activeIndex : 0}
            accentColor="#A855F7"
            textColor={theme === 'dark' ? '#d4d4d8' : '#3f3f46'}
            markerColor={theme === 'dark' ? '#52525b' : '#a1a1aa'}
            markerLength={28}
            markerGap={10}
            maxShift={16}
            itemGap={18}
            fontSize={0.96}
            onItemClick={(idx) => {
              const target = NAV[idx];
              if (target) navigate(target.to);
            }}
          />
        </div>
        <div className="sidebar-note">
          <Icon name="lock" size={16} />
          <p><strong>On-device scanning</strong>Prompts are never uploaded or stored. Activity keeps counts only.</p>
        </div>
      </aside>
      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

      <div className="main" style={{ position: 'relative', zIndex: 1 }}>
        <header className="topbar">
          <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <div className="topbar-fill" />
          <label className="lang-select" title="Select regional language">
            <Icon name="globe" size={15} />
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native} ({l.name})</option>
              ))}
            </select>
          </label>
          <BackendChip />

          <div className="bright-pop-wrap">
            <button
              className="btn btn-sm"
              onClick={() => setBrightOpen((o) => !o)}
              title="Interactive SloshGauge screen brightness"
              aria-expanded={brightOpen}
            >
              <Icon name="sun" size={14} />{brightness}%
            </button>
            {brightOpen && (
              <div className="bright-popover card">
                <div className="tiny muted" style={{ marginBottom: 6, textAlign: 'center', fontWeight: 600 }}>Brightness</div>
                <SloshGauge
                  value={brightness}
                  onChange={(v) => updateSettings({ brightness: Math.max(25, v) })}
                  interactive={true}
                  width={68}
                  height={148}
                  radius={16}
                  liquidColor="#A855F7"
                  glassColor={theme === 'dark' ? '#27272a' : '#e4e4e7'}
                  ariaLabel="Screen brightness"
                />
              </div>
            )}
          </div>

          <button className="icon-btn" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {user ? (
            <button className="user-btn" onClick={logout} title="Sign out"><span className="avatar">{user.name[0].toUpperCase()}</span><span className="user-name">{user.name}</span><Icon name="logout" size={15} /></button>
          ) : (
            <button className="btn btn-sm" onClick={() => setAuthOpen(true)}><Icon name="user" size={15} />Sign in</button>
          )}
        </header>
        <Outlet />
      </div>
    </div>
  );
}
