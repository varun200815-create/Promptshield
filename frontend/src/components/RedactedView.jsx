import { Fragment } from 'react';

/** Renders the safe prompt, drawing placeholder tokens as redaction bars. */
export default function RedactedView({ text, vault, peek }) {
  const tokens = Object.keys(vault);
  if (!tokens.length) return <div className="safe-text">{text || <span className="muted">Your safe prompt appears here.</span>}</div>;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[[\]]/g, '\\$&')).join('|')})`, 'g');
  const bits = text.split(re);
  return (
    <div className="safe-text">
      {bits.map((b, i) => (vault[b] !== undefined
        ? (
          <span key={i} className={`bar ${peek ? 'bar-peek' : ''}`} title={peek ? undefined : b}>
            <span className="bar-token">{peek ? vault[b] : b.slice(1, -1)}</span>
          </span>
        )
        : <Fragment key={i}>{b}</Fragment>))}
    </div>
  );
}
