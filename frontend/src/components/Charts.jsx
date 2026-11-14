import { useId } from 'react';

export const LEVEL_VAR = {
  clean: 'var(--safe)', low: 'var(--sev-low)', medium: 'var(--sev-medium)',
  high: 'var(--sev-high)', critical: 'var(--sev-critical)',
};

/** Semi-circle risk gauge. */
export function RiskGauge({ score, level, label }) {
  const r = 70;
  const c = Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  return (
    <div className="gauge" role="img" aria-label={`${label}, score ${score} out of 100`}>
      <svg viewBox="0 0 180 104" width="100%">
        <path d="M20 90 A70 70 0 0 1 160 90" className="gauge-track" fill="none" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M20 90 A70 70 0 0 1 160 90" fill="none" strokeWidth="12" strokeLinecap="round"
          stroke={LEVEL_VAR[level]} strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className="gauge-fill"
        />
      </svg>
      <div className="gauge-readout">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Area chart for a short daily series. data: [{ label, value }] */
export function AreaChart({ data, height = 180 }) {
  const id = useId();
  const W = 640;
  const pad = { t: 14, r: 10, b: 26, l: 28 };
  const max = Math.max(4, ...data.map((d) => d.value));
  const niceMax = Math.ceil(max / 4) * 4;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v) => pad.t + (1 - v / niceMax) * (height - pad.t - pad.b);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1)} ${height - pad.b} L${x(0)} ${height - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((t) => Math.round(niceMax * t));
  const every = data.length > 10 ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Scans per day" className="area-chart">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid-line" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">{t}</text>
        </g>
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label + i}>
          {d.value > 0 && <circle cx={x(i)} cy={y(d.value)} r="3.4" className="dot" />}
          {i % every === 0 && <text x={x(i)} y={height - 6} textAnchor="middle" className="axis-text">{d.label}</text>}
          <title>{`${d.label}: ${d.value} scan${d.value === 1 ? '' : 's'}`}</title>
        </g>
      ))}
    </svg>
  );
}

/** Donut. segments: [{ key, label, value, color }] */
export function Donut({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" width="150" height="150" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <circle cx="70" cy="70" r={R} fill="none" className="donut-track" strokeWidth="16" />
        {total > 0 && segments.map((s) => {
          if (!s.value) return null;
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={s.key} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="16"
              strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset} transform="rotate(-90 70 70)"
            ><title>{`${s.label}: ${s.value}`}</title></circle>
          );
          offset += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-value">{centerValue}</text>
        <text x="70" y="85" textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.key}><i style={{ background: s.color }} />{s.label}<b>{s.value}</b></li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars. rows: [{ key, label, value, color }] */
export function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="hbars">
      {rows.map((r) => (
        <li key={r.key}>
          <span className="hbar-label">{r.label}</span>
          <span className="hbar-track"><i style={{ width: `${(r.value / max) * 100}%`, background: r.color }} /></span>
          <b>{r.value}</b>
        </li>
      ))}
    </ul>
  );
}
