import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import HoldButton from '../components/HoldButton';
import { useApp } from '../state/AppContext';
import { DETECTOR_MAP, RISK_LEVELS } from '../lib/scanner';
import { download, historyToCsv } from '../lib/report';
import { plural, timeAgo } from '../lib/format';

const FILTERS = ['all', 'critical', 'high', 'medium', 'low', 'clean'];

export default function Activity() {
  const { history, clearHistory, seedDemo } = useApp();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const rows = useMemo(() => history.filter((h) => {
    if (filter !== 'all' && h.level !== filter) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return h.findings.some((f) => DETECTOR_MAP[f.detector]?.label.toLowerCase().includes(needle)) || h.action.includes(needle) || h.source.includes(needle);
  }), [history, filter, q]);

  const shown = rows.slice(0, page * 12);
  const hasDemo = history.some((h) => h.demo);

  return (
    <div className="page">
      <header className="page-head">
        <div><h1>Activity</h1><p className="muted">Every saved scan. Stored as counts and categories only. No prompt text, no values.</p></div>
        <div className="page-actions">
          <button className="btn" disabled={!history.length} onClick={() => download('promptshield-activity.csv', historyToCsv(history), 'text/csv')}><Icon name="download" size={16} />Export CSV</button>
          <button className="btn" disabled={!history.length} onClick={() => download('promptshield-activity.json', JSON.stringify(history, null, 2), 'application/json')}><Icon name="download" size={16} />JSON</button>
        </div>
      </header>

      {!history.length ? (
        <section className="card empty-hero">
          <h2>Nothing saved yet</h2>
          <p className="muted">Use “Save to Activity” in the scanner, or copy a safe prompt, and it will be logged here.</p>
          <div className="btn-row center">
            <Link className="btn btn-primary" to="/app/scanner">Open scanner</Link>
            <button className="btn" onClick={seedDemo}>Add demo activity</button>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="toolbar">
            <div className="segmented" role="radiogroup" aria-label="Filter by risk">
              {FILTERS.map((f) => (
                <button key={f} role="radio" aria-checked={filter === f} className={filter === f ? 'on' : ''}
                  onClick={() => { setFilter(f); setPage(1); }}>{f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <label className="search">
              <Icon name="search" size={15} />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by finding type" aria-label="Search activity" />
            </label>
          </div>

          <div className="table" role="table">
            <div className="tr th" role="row"><span>Risk</span><span>Findings</span><span>Action</span><span>Size</span><span>When</span></div>
            {shown.map((h) => (
              <div className="tr" role="row" key={h.id}>
                <span><i className={`sev sev-${h.level}`}>{h.level === 'clean' ? 'Clean' : RISK_LEVELS[h.level].label.replace(' risk', '')}</i> <small className="muted">{h.score}</small></span>
                <span className="tags">
                  {h.findings.length ? h.findings.map((f) => (
                    <em key={f.detector} className={`tag tag-${f.severity}`}>{DETECTOR_MAP[f.detector]?.label || f.detector}{f.count > 1 ? ` ×${f.count}` : ''}</em>
                  )) : <span className="muted">None</span>}
                </span>
                <span className="cap">{h.action}{h.source === 'file' ? ' · file' : ''}{h.demo ? ' · demo' : ''}</span>
                <span className="muted">{h.chars.toLocaleString()} chars</span>
                <span className="muted" title={new Date(h.at).toLocaleString()}>{timeAgo(h.at)}</span>
              </div>
            ))}
            {!shown.length && <div className="empty"><strong>No matches</strong><p className="muted">Try a different filter or search term.</p></div>}
          </div>

          <div className="card-foot wrap">
            <span className="muted tiny">Showing {shown.length} of {plural(rows.length, 'scan')}</span>
            <div className="btn-row">
              {shown.length < rows.length && <button className="btn btn-sm" onClick={() => setPage((p) => p + 1)}>Show more</button>}
              {hasDemo && <button className="btn btn-sm btn-ghost" onClick={() => clearHistory({ demoOnly: true })}>Remove demo data</button>}
              <HoldButton
                size="sm"
                holdTime={1400}
                fillColor="#ef4444"
                icon={<Icon name="trash" size={14} />}
                doneIcon={<Icon name="check" size={14} />}
                doneLabel="Deleted"
                onHold={() => clearHistory()}
              >
                Hold to delete all
              </HoldButton>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
