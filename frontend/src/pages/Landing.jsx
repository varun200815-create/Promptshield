import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import WebThreads from '../components/WebThreads';
import Tilt from '../components/Tilt';
import { CountUpNumber, CursorSpotlight, CyberMarquee, DecryptedText, Magnetic } from '../components/WowEffects';
import { useApp } from '../state/AppContext';
import { DETECTORS, redact, scan } from '../lib/scanner';
import { SAMPLES } from '../lib/samples';
import { LANGUAGES } from '../lib/i18n';

function HeroDemo() {
  const text = (SAMPLES.find((s) => s.id === 'support') || SAMPLES[0]).text;
  const { matches, risk } = useMemo(() => scan(text), [text]);
  const safe = useMemo(() => redact(text, matches), [text, matches]);
  const [shield, setShield] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShield(true); return undefined; }
    const t = setTimeout(() => setShield(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const parts = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    parts.push(<Fragment key={`t${i}`}>{text.slice(cursor, m.start)}</Fragment>);
    parts.push(
      <span key={m.id} className={`demo-hit ${shield ? 'is-redacted' : ''}`} style={{ '--i': i }}>
        <span className="demo-orig">{m.value}</span>
        <span className="demo-bar" aria-hidden="true">{m.token.slice(1, -1)}</span>
      </span>,
    );
    cursor = m.end;
  });
  parts.push(<Fragment key="end">{text.slice(cursor)}</Fragment>);

  return (
    <Tilt className="demo wow-border-beam wow-laser-scan" maxTilt={12} scale={1.02} glare={true} maxGlare={0.22} aria-label="Live example of PromptShield redacting a prompt">
      <div className="demo-bar-top tilt-pop-sm">
        <span className="demo-title">prompt.txt</span>
        <button className="demo-switch" role="switch" aria-checked={shield} onClick={() => setShield((s) => !s)}>
          <span>{shield ? 'Shield on' : 'Shield off'}</span><i />
        </button>
      </div>
      <pre className="demo-body tilt-pop">{parts}</pre>
      <div className="demo-foot tilt-pop-sm">
        <span><b>{matches.length}</b> values found</span>
        <span className={`sev sev-${risk.level}`}>{risk.label}</span>
        <span className="muted">{safe.redactedCount} hidden before sending</span>
      </div>
    </Tilt>
  );
}

const STEPS = [
  { title: 'Paste your prompt', body: 'Type, paste, or speak in 8 languages. Scanning happens instantly in your browser.' },
  { title: 'Review what was found', body: 'Every email, key, card, and ID is highlighted automatically. Click any pill to keep or hide.' },
  { title: 'Copy the safe version', body: 'One click copies the cleaned prompt with secrets replaced by safe placeholders.' },
  { title: 'Listen or restore', body: 'Hear the risk summary in your own language or paste the AI reply to restore real values.' },
];

export default function Landing() {
  const { theme, setTheme, lang, setLang, user, setAuthOpen } = useApp();

  return (
    <div className="landing" style={{ position: 'relative' }}>
      <CursorSpotlight />
      <div className="threads-bg" aria-hidden="true">
        <WebThreads
          colors={theme === 'dark' ? ['#5227FF', '#FF9FFC', '#00E5FF'] : ['#5227FF', '#A855F7']}
          lightMode={theme === 'light'}
          opacity={theme === 'dark' ? 0.35 : 0.22}
          threadCount={7}
          speed={0.22}
          mouseInteraction={true}
          pulseOnClick={true}
        />
      </div>
      <header className="l-nav" style={{ position: 'relative', zIndex: 1 }}>
        <Link to="/" aria-label="PromptShield home"><Logo /></Link>
        <nav aria-label="Primary">
          <a href="#how" className="bs-link-fx">How it works</a>
          <Link to="/app/scanner" className="bs-link-fx">Scanner</Link>
          <Link to="/app" className="bs-link-fx">Dashboard</Link>
        </nav>
        <div className="l-nav-end">
          <label className="lang-select" title="Select regional language">
            <Icon name="globe" size={15} />
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
          </label>
          <button className="icon-btn" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {!user && (
            <button className="btn btn-sm" onClick={() => setAuthOpen(true)}>
              <Icon name="user" size={14} />Sign in
            </button>
          )}
          <Magnetic>
            <Link to="/app/scanner" className="btn btn-primary">Open scanner</Link>
          </Magnetic>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section className="hero">
          <div className="hero-copy">
            <div className="bs-eyebrow-badge">
              <span className="bs-eyebrow-dot" aria-hidden="true" />
              <DecryptedText text="AI Security, Privacy & Trust" />
            </div>
            <h1 className="bs-display-1">
              <span className="bs-text-gradient">Redact it</span> before the <span className="bs-text-shimmer">AI reads it.</span>
            </h1>
            <p className="lede">
              Paste your prompt, hide <mark className="bs-mark">emails</mark>, <mark className="bs-mark">keys</mark>, <mark className="bs-mark">cards</mark> &amp; <mark className="bs-mark">IDs</mark> in one click, and copy the safe version.
            </p>
            <div className="btn-row">
              <Magnetic>
                <Link to="/app/scanner" className="btn btn-primary btn-lg">Scan a prompt</Link>
              </Magnetic>
              <Magnetic>
                <Link to="/app" className="btn btn-lg">See the dashboard</Link>
              </Magnetic>
            </div>
            <ul className="hero-facts">
              <li><strong className="bs-stat-num"><CountUpNumber value={DETECTORS.length} /></strong> built-in secret &amp; PII detectors</li>
              <li><strong className="bs-stat-num"><CountUpNumber value={8} suffix=" languages" /></strong> with voice input &amp; spoken audio</li>
              <li><strong className="bs-stat-num"><CountUpNumber value={100} suffix="% local" /></strong> — original prompt never leaves your browser</li>
            </ul>
          </div>
          <HeroDemo />
        </section>

        <CyberMarquee />

        <section id="how" className="l-section">
          <h2 className="bs-display-4 bs-heading-fx">
            From paste to safe, <span className="bs-text-shimmer">in four steps</span>
          </h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Tilt as="li" className="wow-border-beam" key={s.title} maxTilt={16} scale={1.04} glare={true} maxGlare={0.25}>
                <span className="step-n tilt-pop">{i + 1}</span>
                <h3 className="tilt-pop-sm">{s.title}</h3>
                <p className="tilt-pop-sm">{s.body}</p>
              </Tilt>
            ))}
          </ol>
        </section>

        <Tilt as="section" className="l-cta wow-border-beam" maxTilt={10} scale={1.02} glare={true} maxGlare={0.28}>
          <h2 className="tilt-pop bs-cta-title">Try it on the last prompt you sent.</h2>
          <div className="tilt-pop">
            <Magnetic>
              <Link to="/app/scanner" className="btn btn-primary btn-lg">Open the scanner</Link>
            </Magnetic>
          </div>
        </Tilt>
      </main>

      <footer className="l-foot" style={{ position: 'relative', zIndex: 1 }}>
        <Logo size={20} />
        <span className="muted">Built for the AI Security, Privacy &amp; Trust challenge.</span>
      </footer>
    </div>
  );
}
