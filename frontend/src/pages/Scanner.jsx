import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import PromptEditor from '../components/PromptEditor';
import RedactedView from '../components/RedactedView';
import HoldButton from '../components/HoldButton';
import SloshGauge from '../components/SloshGauge';
import Tilt from '../components/Tilt';
import MediaRedactor from '../components/MediaRedactor';
import { CountUpNumber, DecryptedText, Magnetic } from '../components/WowEffects';
import { useApp } from '../state/AppContext';
import { api } from '../lib/api';
import { REDACTION_MODES, SEVERITY, localSummary, redact, restore, scan } from '../lib/scanner';
import { SAMPLES, SAMPLE_DEFAULT } from '../lib/samples';
import { buildReport, download } from '../lib/report';
import { formatBytes, plural } from '../lib/format';
import { load, save } from '../lib/storage';
import { LANGUAGES, localizedSummary, speakText, startVoiceInput, stopSpeaking, stopVoiceInput, t } from '../lib/i18n';

const MAX_FILE = 200 * 1024;
const keyOf = (m) => `${m.detector}:${m.value}`;

export default function Scanner() {
  const { settings, updateSettings, lang, setLang, logScan, notify, backend } = useApp();
  const [text, setText] = useState(() => load('draft', SAMPLE_DEFAULT.text));
  const [skipKeys, setSkipKeys] = useState(() => new Set());
  const [peek, setPeek] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [reply, setReply] = useState('');
  const [ai, setAi] = useState({ busy: null, explanation: '', provider: '', rewrite: '' });
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const fileInput = useRef(null);

  const deferred = useDeferredValue(text);
  const result = useMemo(() => scan(deferred, { disabled: settings.disabled }), [deferred, settings.disabled]);

  const skipIds = useMemo(
    () => new Set(result.matches.filter((m) => skipKeys.has(keyOf(m))).map((m) => m.id)),
    [result.matches, skipKeys],
  );
  const safe = useMemo(
    () => redact(deferred, result.matches, { mode: settings.mode, skip: skipIds }),
    [deferred, result.matches, settings.mode, skipIds],
  );

  useEffect(() => { const timer = setTimeout(() => save('draft', text), 400); return () => clearTimeout(timer); }, [text]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const m of result.matches) {
      if (!map.has(m.detector)) map.set(m.detector, { ...m, items: [] });
      map.get(m.detector).items.push(m);
    }
    return [...map.values()].sort((a, b) => SEVERITY[b.severity].rank - SEVERITY[a.severity].rank);
  }, [result.matches]);

  const resetAi = () => setAi({ busy: null, explanation: '', provider: '', rewrite: '' });

  const loadText = (next, name = '') => {
    setText(next); setFileName(name); setSkipKeys(new Set()); setReply(''); resetAi();
  };

  async function readFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE) { notify(`File is ${formatBytes(file.size)}. Keep it under 200 KB.`, 'error'); return; }
    try {
      const content = await file.text();
      if (content.includes('\u0000')) { notify('That looks like a binary file. Use a text file.', 'error'); return; }
      loadText(content, file.name);
      notify(`Loaded ${file.name}`);
    } catch {
      notify('Could not read that file.', 'error');
    }
  }

  const toggleGroup = (g) => setSkipKeys((prev) => {
    const next = new Set(prev);
    const keys = [...new Set(g.items.map(keyOf))];
    const allSkipped = keys.every((k) => next.has(k));
    keys.forEach((k) => (allSkipped ? next.delete(k) : next.add(k)));
    return next;
  });

  const copySafe = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(safe.text);
      logScan(result, { action: safe.redactedCount ? 'redacted' : 'scanned', source: fileName ? 'file' : 'manual' });
      notify(safe.redactedCount ? `Copied safe prompt (${plural(safe.redactedCount, 'secret')} hidden)` : 'Copied prompt');
    } catch {
      notify('Clipboard is blocked in this browser. Select the text and copy it manually.', 'error');
    }
  }, [safe, result, fileName, logScan, notify]);

  async function rewrite() {
    setAi((a) => ({ ...a, busy: 'rewrite' }));
    try {
      const r = await api.rewrite({ redactedPrompt: safe.text.slice(0, 8000), lang });
      setAi((a) => ({ ...a, busy: null, rewrite: r.rewrite }));
    } catch (e) {
      setAi((a) => ({ ...a, busy: null }));
      notify(e.message, 'error');
    }
  }

  function handleVoiceInput() {
    if (listening) {
      stopVoiceInput();
      setListening(false);
      setInterimText('');
      return;
    }
    // If default sample text is still loaded, clear it so the user's voice appears clearly at the top
    if (text === SAMPLE_DEFAULT.text) {
      setText('');
    }
    setListening(true);
    setInterimText('Listening… speak now');
    const session = startVoiceInput(lang, {
      onInterim: (live) => {
        setInterimText(live || 'Listening… speak now');
      },
      onResult: (spoken) => {
        setText((prev) => (prev && prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
        notify(`Transcribed: "${spoken.slice(0, 42)}${spoken.length > 42 ? '…' : ''}"`);
      },
      onEnd: () => {
        setListening(false);
        setInterimText('');
      },
      onError: (msg) => {
        setListening(false);
        setInterimText('');
        notify(msg, 'error');
      },
    });
    if (!session) {
      setListening(false);
      setInterimText('');
    }
  }

  function handleSpeak(textToRead) {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const ok = speakText(textToRead, lang, () => setSpeaking(false));
    if (!ok) {
      setSpeaking(false);
      notify('Speech synthesis is not available in this browser.', 'error');
    }
  }

  const restored = useMemo(() => restore(reply, safe.vault), [reply, safe.vault]);
  const empty = !deferred.trim();
  const summaryText = localizedSummary(result, lang, localSummary(result));
  const quickSamples = SAMPLES.slice(0, 4);

  return (
    <div className="page scanner-page simple-scanner">
      {/* SIMPLE TOP BAR: Quick examples on left, Language + Listen on right */}
      <div className="simple-topbar">
        <div className="sample-row" role="group" aria-label="Sample prompts">
          <span className="muted">Examples:</span>
          {quickSamples.map((s) => (
            <button key={s.id} className="chip" onClick={() => loadText(s.text)}>{s.title}</button>
          ))}
        </div>

        <div className="simple-lang-controls">
          <label className="lang-select" title="Choose language for voice & summary">
            <Icon name="globe" size={14} />
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-primary btn-sm"
            disabled={empty}
            onClick={() => handleSpeak(summaryText)}
            title="Read result out loud in your chosen language"
          >
            <Icon name="volume" size={15} />
            {speaking ? t(lang, 'stopAudio') : `${t(lang, 'listenSummary')}`}
          </button>
        </div>
      </div>

      {/* TOP HEAD PANEL: BILL, PHOTO & VIDEO AUTO-BLUR SHIELD */}
      <MediaRedactor
        onExtractedText={(extracted) => loadText(extracted, 'scanned-media.txt')}
        notify={notify}
      />

      {/* MAIN 2-BOX WORKBENCH: 1. Write Here -> 2. Copy Safe Prompt */}
      <div className="workbench-grid">
        <section
          className="card editor-card wow-border-beam wow-laser-scan"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}
        >
          <div className="card-head">
            <h2 className="bs-heading-fx">
              <span className="step-badge">1</span>
              <span className="bs-text-gradient"><DecryptedText text={t(lang, 'yourPrompt')} speed={24} /></span>
            </h2>
            <span className="meta">Write or paste here</span>
          </div>

          <PromptEditor
            value={text}
            onChange={(v) => { setText(v); if (fileName) setFileName(''); }}
            matches={result.matches}
            skip={skipIds}
            placeholder="Type, paste, or click Voice Input below to speak…"
          />
          {listening && (
            <div className="voice-live-banner" role="status" aria-live="polite">
              <span className="voice-pulse-dot" />
              <span>{interimText || 'Listening… speak now'}</span>
              <button type="button" className="btn btn-sm btn-danger" onClick={handleVoiceInput}>
                Done speaking
              </button>
            </div>
          )}
          {dragging && <div className="drop-hint"><Icon name="upload" size={22} />Drop text file here</div>}

          <div className="card-foot">
            <div className="btn-row">
              <input
                ref={fileInput}
                type="file"
                hidden
                accept=".txt,.md,.json,.csv,.log,.env,.yml,.yaml,.js,.ts,.py,.xml,text/*"
                onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }}
              />
              <button
                type="button"
                className={`btn btn-sm ${listening ? 'btn-danger voice-btn-active' : 'btn-primary'}`}
                onClick={handleVoiceInput}
              >
                <Icon name="mic" size={14} />
                {listening ? `${t(lang, 'stopAudio')} (${t(lang, 'listening')})` : `${t(lang, 'voiceInput')} (${LANGUAGES.find((l) => l.code === lang)?.native})`}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => fileInput.current?.click()} title="Upload a text file">
                <Icon name="upload" size={14} />{t(lang, 'uploadFile')}
              </button>
            </div>
            <HoldButton
              size="sm"
              holdTime={650}
              fillColor="#ef4444"
              disabled={empty}
              icon={<Icon name="trash" size={14} />}
              doneIcon={<Icon name="check" size={14} />}
              doneLabel={t(lang, 'cleared')}
              onHold={() => loadText('')}
            >
              {t(lang, 'clear')}
            </HoldButton>
          </div>
        </section>

        <section className="card safe-card wow-border-beam">
          <div className="card-head">
            <h2 className="bs-heading-fx">
              <span className="step-badge">2</span>
              <span className="bs-text-shimmer"><DecryptedText text={t(lang, 'safePrompt')} speed={24} /></span>
            </h2>
            <span className="meta">
              {safe.redactedCount ? `${safe.redactedCount} hidden automatically` : 'Ready to send'}
            </span>
          </div>

          <RedactedView text={safe.text} vault={safe.vault} peek={peek && settings.mode === 'placeholder'} />

          <div className="card-foot">
            <Magnetic className="btn-block" strength={0.12}>
              <button className="btn btn-primary btn-block" onClick={copySafe} disabled={empty}>
                <Icon name="copy" size={16} />{t(lang, 'copySafe')}
              </button>
            </Magnetic>
            {settings.mode === 'placeholder' && Object.keys(safe.vault).length > 0 && (
              <button className="btn btn-sm" onClick={() => setPeek((p) => !p)} aria-pressed={peek}>
                <Icon name={peek ? 'eye-off' : 'eye'} size={14} />{peek ? 'Hide' : 'Peek'}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* INSTANT RESULT BAR: Risk Meter + Plain Summary + Quick Pill Toggles */}
      <Tilt className="card simple-result-banner wow-border-beam" maxTilt={5} scale={1.005} glare={true} maxGlare={0.12}>
        <div className="simple-result-main">
          <div className="simple-meter-box">
            <SloshGauge
              value={result.risk.score}
              interactive={false}
              width={48}
              height={84}
              radius={13}
              liquidColor={result.risk.level === 'critical' || result.risk.level === 'high' ? '#ef4444' : result.risk.level === 'medium' ? '#f59e0b' : '#22c55e'}
              ariaLabel="Risk level meter"
            />
            <div>
              <span className={`sev sev-${result.risk.level}`}>{empty ? 'Empty' : result.risk.label}</span>
              <div className="simple-score-num bs-stat-num">
                <CountUpNumber value={result.risk.score} duration={500} />
                <span>/100</span>
              </div>
            </div>
          </div>

          <div className="simple-summary-box">
            <p className="simple-summary-text">
              {empty ? 'Type or paste anything above — secrets will be hidden automatically.' : summaryText}
            </p>
            {groups.length > 0 && (
              <div className="simple-tags-row" aria-label="Detected items (click to keep or hide)">
                <span className="tiny muted">Found (click to toggle):</span>
                {groups.map((g) => {
                  const keys = [...new Set(g.items.map(keyOf))];
                  const skipped = keys.every((k) => skipKeys.has(k));
                  return (
                    <button
                      key={g.detector}
                      type="button"
                      onClick={() => g.redact && toggleGroup(g)}
                      className={`simple-finding-pill ${skipped ? 'is-kept' : 'is-hidden'}`}
                      title={skipped ? 'Click to hide this in Safe Prompt' : 'Click to keep original value'}
                    >
                      <span className={`dot dot-${g.severity}`} />
                      <b>{g.label}</b>
                      <span>×{g.items.length}</span>
                      <em>{skipped ? 'Kept' : 'Hidden'}</em>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="simple-actions-box">
            <button
              className="btn btn-sm"
              disabled={empty}
              onClick={() => handleSpeak(summaryText)}
            >
              <Icon name="volume" size={14} />{speaking ? t(lang, 'stopAudio') : t(lang, 'listenSummary')}
            </button>
            {settings.aiEnabled && (
              <button
                className="btn btn-sm"
                onClick={rewrite}
                disabled={empty || !!ai.busy || backend.state !== 'online'}
              >
                <Icon name="wand" size={14} />{ai.busy === 'rewrite' ? 'Rewriting…' : t(lang, 'rewriteSafely')}
              </button>
            )}
          </div>
        </div>

        {ai.rewrite && (
          <div className="ai-out" style={{ marginTop: 12 }}>
            <div className="restore-head">
              <span className="tiny muted">AI Polished Safe Prompt</span>
              <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(ai.rewrite).then(() => notify('Copied'))}>
                <Icon name="copy" size={13} />Copy
              </button>
            </div>
            <pre>{ai.rewrite}</pre>
          </div>
        )}
      </Tilt>

      {/* STEP 3: RESTORE REPLY, EXPORT API & REDACTION STYLE */}
      <section className="card simple-more-drawer wow-border-beam" style={{ padding: '18px 20px' }}>
        <div className="card-head" style={{ marginBottom: 14 }}>
          <h2 className="bs-heading-fx">
            <span className="step-badge">3</span>
            <span>Restore reply &amp; export</span>
          </h2>
          <span className="meta">Put real values back into the AI reply, change style, or export JSON / Markdown</span>
        </div>

        <div className="simple-more-body" style={{ padding: 0, borderTop: 'none' }}>
          <div className="simple-more-row">
            <div>
              <strong>Redaction style</strong>
              <p className="muted tiny">Choose how secrets are hidden in your Safe Prompt</p>
            </div>
            <div className="segmented" role="radiogroup" aria-label="Redaction style">
              {Object.entries(REDACTION_MODES).map(([id, m]) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={settings.mode === id}
                  className={settings.mode === id ? 'on' : ''}
                  onClick={() => updateSettings({ mode: id })}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="btn-row">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  const apiPayload = {
                    timestamp: new Date().toISOString(),
                    mode: settings.mode,
                    risk: result.risk,
                    counts: result.counts,
                    redactedCount: safe.redactedCount,
                    safePrompt: safe.text,
                    findings: result.matches.map((m) => ({
                      detector: m.detector,
                      label: m.label,
                      category: m.category,
                      severity: m.severity,
                    })),
                  };
                  download('promptshield-api-export.json', JSON.stringify(apiPayload, null, 2), 'application/json');
                  notify('Exported API JSON payload (.json)');
                }}
                disabled={empty}
              >
                <Icon name="code" size={14} />Export API (.json)
              </button>
              <button
                className="btn btn-sm"
                onClick={() => download('promptshield-report.md', buildReport(result, { mode: settings.mode, redactedCount: safe.redactedCount }), 'text/markdown')}
                disabled={empty}
              >
                <Icon name="download" size={14} />Download Report (.md)
              </button>
            </div>
          </div>

          <div className="simple-restore-box">
            <strong>{t(lang, 'restoreReply')}</strong>
            <textarea
              className="plain-area"
              rows={2}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Paste the AI reply containing [EMAIL_1], [PHONE_1]… to put your real values back."
            />
            {reply && (
              <div className="restore-out">
                <div className="restore-head">
                  <span className="muted tiny">{plural(restored.restoredCount, 'value')} restored</span>
                  <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(restored.text).then(() => notify('Restored reply copied'))}>
                    <Icon name="copy" size={14} />Copy
                  </button>
                </div>
                <pre>{restored.text}</pre>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
