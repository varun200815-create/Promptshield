import { DETECTOR_MAP, RISK_LEVELS } from './scanner';

export function download(filename, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Privacy report: contains labels and counts only. Never the original values. */
export function buildReport(result, { mode, redactedCount }) {
  const lines = [
    '# PromptShield scan report',
    '',
    `- Generated: ${new Date().toLocaleString()}`,
    `- Risk: **${RISK_LEVELS[result.risk.level].label}** (score ${result.risk.score}/100)`,
    `- Characters scanned: ${result.chars}`,
    `- Values redacted: ${redactedCount} (mode: ${mode})`,
    `- Prompt-injection signals: ${result.counts.injection}`,
    '',
    '## Findings',
    '',
  ];
  if (!result.findings.length) lines.push('No known patterns were detected.');
  for (const f of result.findings) {
    const det = DETECTOR_MAP[f.detector];
    lines.push(`- **${f.label}** · ${f.severity} · ${f.count} occurrence${f.count === 1 ? '' : 's'} — ${det?.description || ''}`);
  }
  lines.push('', '_Original values are intentionally excluded from this report. Pattern matching can miss context-specific data._');
  return lines.join('\n');
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function historyToCsv(history) {
  const head = ['time', 'risk_level', 'risk_score', 'characters', 'action', 'source', 'findings'];
  const rows = history.map((h) => [
    h.at, h.level, h.score, h.chars, h.action, h.source,
    h.findings.map((f) => `${f.detector}x${f.count}`).join(' '),
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
