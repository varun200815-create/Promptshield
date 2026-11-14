import { useRef } from 'react';

/**
 * Textarea with a live highlight layer behind it.
 * The layer renders the same text in the same font, so highlights line up with what you type.
 */
export default function PromptEditor({ value, onChange, matches, skip, onToggle, placeholder }) {
  const layer = useRef(null);

  const parts = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) parts.push(value.slice(cursor, m.start));
    const off = skip.has(m.id) || !m.redact;
    parts.push(
      <mark key={m.id} className={`hl hl-${m.severity}${m.redact ? '' : ' hl-flag'}${skip.has(m.id) ? ' hl-skipped' : ''}`} data-off={off || undefined}>
        {value.slice(m.start, m.end)}
      </mark>,
    );
    cursor = m.end;
  }
  parts.push(value.slice(cursor));

  return (
    <div className="editor">
      <pre className="editor-layer" ref={layer} aria-hidden="true">{parts}{'​'}</pre>
      <textarea
        className="editor-input"
        value={value}
        spellCheck={false}
        placeholder={placeholder}
        aria-label="Prompt to scan"
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (layer.current) {
            layer.current.scrollTop = e.target.scrollTop;
            layer.current.scrollLeft = e.target.scrollLeft;
          }
        }}
      />
    </div>
  );
}
