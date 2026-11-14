import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import Tilt from '../components/Tilt';
import { CountUpNumber, DecryptedText, Magnetic } from '../components/WowEffects';
import { AreaChart, Donut, HBars, LEVEL_VAR } from '../components/Charts';
import { useApp } from '../state/AppContext';
import { DETECTOR_MAP, RISK_LEVELS } from '../lib/scanner';
import { dayKey, plural, timeAgo } from '../lib/format';

const DAYS = 14;

export default function Overview() {
  const { history, seedDemo, user } = useApp();

  const data = useMemo(() => {
    const byDay = new Map();
    const levels = { clean: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const byType = new Map();
    let values = 0;
    let critical = 0;
    let scoreSum = 0;
    for (const h of history) {
      byDay.set(dayKey(h.at), (byDay.get(dayKey(h.at)) || 0) + 1);
      levels[h.level] = (levels[h.level] || 0) + 1;
      scoreSum += h.score;
      for (const f of h.findings) {
        const det = DETECTOR_MAP[f.detector];
        if (!det || det.redact === false) continue;
        values += f.count;
        if (f.severity === 'critical') critical += f.count;
        byType.set(f.detector, (byType.get(f.detector) || 0) + f.count);
      }
    }
    const series = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      series.push({ label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: byDay.get(dayKey(d)) || 0 });
    }
    const top = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([id, value]) => ({ key: id, label: DETECTOR_MAP[id].label, value, color: LEVEL_VAR[DETECTOR_MAP[id].severity] }));
    return { series, levels, top, values, critical, avg: history.length ? Math.round(scoreSum / history.length) : 0 };
  }, [history]);

  if (!history.length) {
    return (
      <div className="page">
        <header className="page-head"><div><h1>Overview</h1><p className="muted">Your protection summary builds up as you scan.</p></div></header>
        <section className="card empty-hero">
          <div className="empty-art" aria-hidden="true">
            <span className="bar w60" /><span className="bar w40" /><span className="bar w75" />
          </div>
          <h2>No scans yet</h2>
          <p className="muted">Run your first scan and this page will chart what PromptShield caught. Activity stores counts and categories only, never your prompt.</p>
          <div className="btn-row center">
            <Link className="btn btn-primary" to="/app/scanner"><Icon name="scan" size={16} />Scan a prompt</Link>
            <button className="btn" onClick={seedDemo}><Icon name="sparkles" size={16} />Fill with demo activity</button>
          </div>
        </section>
      </div>
    );
  }

  const stats = [
    { label: 'Prompts scanned', value: history.length, icon: 'scan' },
    { label: 'Sensitive values caught', value: data.values, icon: 'shield-check' },
    { label: 'Critical exposures', value: data.critical, icon: 'alert', tone: data.critical ? 'danger' : '' },
    { label: 'Average risk score', value: data.avg, icon: 'activity', suffix: '/100' },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="bs-text-gradient"><DecryptedText text={user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Overview'} /></h1>
          <p className="muted">What PromptShield caught in the last {DAYS} days.</p>
        </div>
        <Magnetic>
          <Link className="btn btn-primary" to="/app/scanner"><Icon name="scan" size={16} />New scan</Link>
        </Magnetic>
      </header>

      <div className="stat-grid">
        {stats.map((s) => (
          <Tilt key={s.label} className={`stat wow-border-beam ${s.tone || ''}`} maxTilt={14} scale={1.03} glare={true} maxGlare={0.18}>
            <Icon name={s.icon} size={18} className="tilt-pop-sm" />
            <strong className="tilt-pop bs-stat-num"><CountUpNumber value={s.value} /><small>{s.suffix}</small></strong>
            <span className="tilt-pop-sm">{s.label}</span>
          </Tilt>
        ))}
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head"><h2>Scans per day</h2></div>
          <AreaChart data={data.series} />
        </section>
        <section className="card">
          <div className="card-head"><h2>Risk mix</h2></div>
          <Donut centerValue={history.length} centerLabel="scans"
            segments={['critical', 'high', 'medium', 'low', 'clean'].map((k) => ({ key: k, label: k === 'clean' ? 'Clean' : RISK_LEVELS[k].label.replace(' risk', ''), value: data.levels[k] || 0, color: LEVEL_VAR[k] }))} />
        </section>
      </div>

      <div className="grid-1-1">
        <section className="card">
          <div className="card-head"><h2>Most common exposures</h2></div>
          {data.top.length ? <HBars rows={data.top} /> : <p className="muted">No sensitive values caught yet.</p>}
        </section>
        <section className="card">
          <div className="card-head"><h2>Recent scans</h2><Link className="link-btn" to="/app/activity">View all</Link></div>
          <ul className="recent">
            {history.slice(0, 5).map((h) => (
              <li key={h.id}>
                <span className={`sev sev-${h.level}`}>{h.level === 'clean' ? 'Clean' : RISK_LEVELS[h.level].label.replace(' risk', '')}</span>
                <span className="recent-main">
                  {h.findings.length ? plural(h.findings.reduce((n, f) => n + f.count, 0), 'finding') : 'No findings'}
                  <small className="muted">{h.findings.slice(0, 3).map((f) => DETECTOR_MAP[f.detector]?.label).filter(Boolean).join(', ')}</small>
                </span>
                <span className="muted tiny">{timeAgo(h.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
