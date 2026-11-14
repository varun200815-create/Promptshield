import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, getToken, setToken } from '../lib/api';
import { load, save } from '../lib/storage';
import { makeDemoHistory } from '../lib/samples';
import { uid } from '../lib/format';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const DEFAULT_SETTINGS = {
  mode: 'placeholder',
  disabled: [],
  aiEnabled: true,
  lang: 'en',
  brightness: 100,
};

function initialTheme() {
  const stored = load('theme', null);
  if (stored) return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }));
  const [history, setHistory] = useState(() => load('history', []));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));
  const [authOpen, setAuthOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [backend, setBackend] = useState({ state: 'checking' });
  const toastId = useRef(0);

  /* theme & brightness */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save('theme', theme);
  }, [theme]);

  useEffect(() => {
    const b = Math.min(100, Math.max(20, Number(settings.brightness ?? 100)));
    document.documentElement.style.filter = b < 100 ? `brightness(${(0.35 + (b / 100) * 0.65).toFixed(2)})` : '';
  }, [settings.brightness]);

  /* persistence */
  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('history', history.slice(0, 500)), [history]);

  /* toasts */
  const notify = useCallback((message, tone = 'ok') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* backend health: poll so the status chip is real, not decorative */
  const checkHealth = useCallback(async () => {
    try {
      const h = await api.health();
      setBackend({ state: 'online', persistence: h.persistence, ai: h.aiConfigured });
    } catch {
      setBackend({ state: 'offline' });
    }
  }, []);
  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 30000);
    return () => clearInterval(t);
  }, [checkHealth]);

  /* restore session */
  useEffect(() => {
    if (!getToken()) {
      setAuthLoading(false);
      return;
    }
    api.me()
      .then((r) => setUser(r.user))
      .catch((e) => { if (e.status === 401) setToken(null); })
      .finally(() => setAuthLoading(false));
  }, []);

  /* settings */
  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const toggleDetector = useCallback((id) => setSettings((s) => ({
    ...s, disabled: s.disabled.includes(id) ? s.disabled.filter((d) => d !== id) : [...s.disabled, id],
  })), []);

  /* history (metadata only: never prompt text or detected values) */
  const logScan = useCallback((result, { action = 'scanned', source = 'manual' } = {}) => {
    const entry = {
      id: uid(), at: new Date().toISOString(), level: result.risk.level, score: result.risk.score,
      chars: result.chars, action, source,
      findings: result.findings.map((f) => ({ detector: f.detector, severity: f.severity, count: f.count })),
    };
    setHistory((h) => [entry, ...h]);
    if (getToken()) {
      api.recordScan({
        risk: { level: entry.level === 'clean' ? 'low' : entry.level, score: entry.score },
        findingTypes: entry.findings, action, chars: entry.chars,
      }).catch(() => { /* history stays local if the API is offline */ });
    }
    return entry;
  }, []);

  const seedDemo = useCallback(() => {
    setHistory((h) => [...h.filter((x) => !x.demo), ...makeDemoHistory()].sort((a, b) => b.at.localeCompare(a.at)));
    notify('Demo activity added');
  }, [notify]);

  const clearHistory = useCallback(async ({ demoOnly = false } = {}) => {
    setHistory((h) => (demoOnly ? h.filter((x) => !x.demo) : []));
    if (!demoOnly && getToken()) api.clearScans().catch(() => {});
    notify(demoOnly ? 'Demo activity removed' : 'Activity cleared');
  }, [notify]);

  /* auth */
  const authenticate = useCallback(async (mode, form) => {
    const data = mode === 'login'
      ? await api.login({ email: form.email, password: form.password })
      : await api.register(form);
    setToken(data.token);
    setUser(data.user);
    setAuthOpen(false);
    notify(`Signed in as ${data.user.name}`);
  }, [notify]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    notify('Signed out');
  }, [notify]);

  const lang = settings.lang || 'en';
  const setLang = useCallback((code) => updateSettings({ lang: code }), [updateSettings]);

  const value = useMemo(() => ({
    theme, setTheme, settings, updateSettings, toggleDetector,
    lang, setLang,
    history, logScan, seedDemo, clearHistory,
    user, authLoading, authOpen, setAuthOpen, authenticate, logout,
    toasts, notify, backend, checkHealth,
  }), [theme, settings, updateSettings, toggleDetector, lang, setLang, history, logScan, seedDemo, clearHistory,
    user, authLoading, authOpen, authenticate, logout, toasts, notify, backend, checkHealth]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
