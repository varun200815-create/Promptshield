import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { useApp } from '../state/AppContext';
import { CATEGORIES, DETECTORS, SEVERITY, findMatches } from '../lib/scanner';

export default function Rules() {
  const { settings, toggleDetector, updateSettings } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [tryText, setTryText] = useState('');

  const list = useMemo(() => DETECTORS.filter((d) => (cat === 'all' || d.category === cat)
    && (!q.trim() || `${d.label} ${d.description}`.toLowerCase().includes(q.toLowerCase()))), [q, cat]);
  const enabled = DETECTORS.length - settings.disabled.length;

  const tester = useMemo(() => findMatches(tryText, { disabled: settings.disabled }), [tryText, settings.disabled]);

  return (
    <div className="page">
      <header className="page-head">
        <div><h1>Detectors</h1><p className="muted">{enabled} of {DETECTORS.length} detectors active. Turn off anything that creates noise for your work.</p></div>
        <div className="page-actions">
          <button className="btn" onClick={() => updateSettings({ disabled: [] })} disabled={!settings.disabled.length}>Enable all</button>
        </div>
      </header>

      <section className="card tester">
        <div className="card-head"><h2>Test a string</h2><span className="meta">Runs against the detectors you have enabled</span></div>
        <input className="plain-input mono" value={tryText} onChange={(e) => setTryText(e.target.value)} placeholder="Paste anything, e.g. 4111 1111 1111 1111" aria-label="Test string" />
        {tryText && (
          <div className="tester-out">
            {tester.length
              ? tester.map((m) => <span key={m.id} className={`tag tag-${m.severity}`}>{m.label}</span>)
              : <span className="muted">No detector matches this text.</span>}
          </div>
        )}
      </section>

      <div className="toolbar">
        <div className="segmented scroll" role="radiogroup" aria-label="Category">
          <button role="radio" aria-checked={cat === 'all'} className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>All</button>
          {Object.entries(CATEGORIES).map(([id, c]) => (
            <button key={id} role="radio" aria-checked={cat === id} className={cat === id ? 'on' : ''} onClick={() => setCat(id)}>{c.label}</button>
          ))}
        </div>
        <label className="search"><Icon name="search" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search detectors" aria-label="Search detectors" /></label>
      </div>

      <div className="rule-grid">
        {list.map((d) => {
          const off = settings.disabled.includes(d.id);
          return (
            <article key={d.id} className={`rule ${off ? 'is-off' : ''}`}>
              <div className="rule-top">
                <span className={`sev sev-${d.severity}`}>{SEVERITY[d.severity].label}</span>
                <label className="switch">
                  <input type="checkbox" checked={!off} onChange={() => toggleDetector(d.id)} aria-label={`${d.label} detector`} />
                  <i />
                </label>
              </div>
              <h3>{d.label}</h3>
              <p className="muted">{d.description}</p>
              <code className="rule-example">{d.example.split('\n')[0]}</code>
              <div className="rule-foot muted tiny">{CATEGORIES[d.category].label}{d.redact === false ? ' · flag only' : ''}{d.validate ? ' · checksum verified' : ''}</div>
            </article>
          );
        })}
        {!list.length && <div className="empty"><strong>No detectors match</strong></div>}
      </div>
    </div>
  );
}
