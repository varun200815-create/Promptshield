import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from './config.js';
import { registerSchema, loginSchema, scanSchema, recordScanSchema, explainSchema, rewriteSchema } from './validation.js';
import { createUser, findUserByEmail, saveScan, listScans, deleteScans, isPersistent, supabaseSignUp, supabaseSignIn } from './store.js';
import { signToken, requireAuth, verifyBearerToken } from './auth.js';
import { scan, redact, localSummary, DETECTORS } from './scanner.js';
import { explainFindings, rewritePrompt, transcribeAudio, scanImageVision } from './gemini.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Render's proxy, so rate limits see the real client IP
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigin.split(',').map((s) => s.trim()), credentials: false }));
app.use(express.json({ limit: '15mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 90, standardHeaders: 'draft-7', legacyHeaders: false }));
// Stricter limits where it matters: password guessing and paid AI calls.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Try again in a few minutes.' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Slow down: AI requests are limited to 12 per minute.' } });

function parse(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    res.status(400).json({ error: issue ? `${issue.path.join('.') || 'request'}: ${issue.message}` : 'Invalid request.' });
    return null;
  }
  return result.data;
}

async function optionalUserId(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const user = await verifyBearerToken(header.slice(7));
  return user?.id || null;
}

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'PromptShield API',
  persistence: isPersistent ? 'supabase' : 'demo-memory',
  aiConfigured: Boolean(config.geminiApiKey),
  scanner: 'local-pattern-engine',
  detectors: DETECTORS.length,
}));

app.get('/api/rules', (_req, res) => res.json({
  rules: DETECTORS.map(({ id, label, category, severity, description, redact }) => ({ id, label, category, severity, description, redact: redact !== false })),
}));

/* ---- Multilingual Neural TTS Proxy (supports kn, mr, hi, te, ta, bn, es, en without OS voice packs) ---- */
app.get('/api/tts', async (req, res) => {
  try {
    const rawLang = String(req.query.lang || 'en').slice(0, 5).toLowerCase();
    const allowed = new Set(['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'es']);
    const tl = allowed.has(rawLang) ? rawLang : 'en';
    const text = String(req.query.text || '').trim().slice(0, 500);
    if (!text) return res.status(400).json({ error: 'Missing text parameter' });

    // Split text into safe <= 180 char sentence chunks so Google TTS reads the entire message cleanly
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= 180) {
        chunks.push(remaining);
        break;
      }
      let cut = remaining.lastIndexOf(' ', 180);
      if (cut <= 20) cut = 180;
      chunks.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }

    const buffers = [];
    for (const chunk of chunks) {
      const urls = [
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`,
        `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`,
      ];
      let chunkBuffer = null;
      for (const url of urls) {
        try {
          const upstream = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
              Referer: 'https://translate.google.com/',
            },
            signal: AbortSignal.timeout(8000),
          });
          if (upstream.ok) {
            const arr = await upstream.arrayBuffer();
            if (arr.byteLength > 100) {
              chunkBuffer = Buffer.from(arr);
              break;
            }
          }
        } catch {
          // try next mirror
        }
      }
      if (!chunkBuffer) throw new Error('All TTS mirrors failed');
      buffers.push(chunkBuffer);
    }

    const combined = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(combined);
  } catch (err) {
    console.warn('[tts-fallback]', err?.message);
    return res.status(502).json({ error: 'TTS service unavailable' });
  }
});

/* ---- Multilingual Speech-to-Text (STT) Fallback Endpoint ---- */
app.post('/api/stt', aiLimiter, async (req, res) => {
  try {
    const { audioBase64, mimeType, lang } = req.body || {};
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing audioBase64 payload' });
    }
    const transcript = await transcribeAudio({
      audioBase64,
      mimeType: typeof mimeType === 'string' ? mimeType : 'audio/webm',
      lang: typeof lang === 'string' ? lang.slice(0, 5) : 'en',
    });
    return res.json({ transcript });
  } catch (err) {
    console.warn('[stt-error]', err?.message);
    return res.status(502).json({ error: 'Could not transcribe audio on server.' });
  }
});

/* ---- Visual Bill / Photo / Video Frame PII Scanner ---- */
app.post('/api/vision-scan', aiLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }
    const result = await scanImageVision({
      imageBase64,
      mimeType: typeof mimeType === 'string' ? mimeType : 'image/png',
    });
    return res.json(result || { extractedText: '', regions: [] });
  } catch (err) {
    console.warn('[vision-scan-error]', err?.message);
    return res.status(502).json({ error: 'Vision scan fallback triggered.' });
  }
});

/* ---- auth ---- */

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const body = parse(registerSchema, req.body, res);
    if (!body) return;
    const email = body.email.toLowerCase();
    if (await findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' });
    const sbAuth = await supabaseSignUp({ name: body.name, email, password: body.password });
    const userId = sbAuth?.user?.id || crypto.randomUUID();
    const created = await createUser({
      id: userId, name: body.name, email,
      password_hash: await bcrypt.hash(body.password, 12),
      created_at: new Date().toISOString(),
    });
    const publicUser = { id: created.id, name: created.name, email: created.email, authProvider: sbAuth ? 'supabase' : 'jwt' };
    return res.status(201).json({ token: signToken(publicUser), supabaseAccessToken: sbAuth?.accessToken || null, user: publicUser });
  } catch (error) { return next(error); }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const body = parse(loginSchema, req.body, res);
    if (!body) return;
    const email = body.email.toLowerCase();
    const sbAuth = await supabaseSignIn({ email, password: body.password });
    if (sbAuth?.user) {
      const publicUser = { ...sbAuth.user, authProvider: 'supabase' };
      return res.json({ token: signToken(publicUser), supabaseAccessToken: sbAuth.accessToken, user: publicUser });
    }
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const publicUser = { id: user.id, name: user.name, email: user.email, authProvider: 'jwt' };
    return res.json({ token: signToken(publicUser), user: publicUser });
  } catch (error) { return next(error); }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

/* ---- scanning ---- */

// Server-side scan for API users and integrations. The web app scans locally instead.
app.post('/api/scan', async (req, res, next) => {
  try {
    const body = parse(scanSchema, req.body, res);
    if (!body) return;
    const result = scan(body.prompt);
    const safe = redact(body.prompt, result.matches, { mode: body.mode });
    const scanId = crypto.randomUUID();
    // Store only categories, severities and counts. Never prompt text or detected values.
    await saveScan(await optionalUserId(req), { scanId, risk: result.risk, findings: result.findings });
    return res.json({
      scanId,
      risk: result.risk,
      findings: result.findings,
      counts: result.counts,
      redactedPrompt: safe.text,
      summary: localSummary(result),
      scannedAt: new Date().toISOString(),
      privacy: { rawPromptStored: false, rawValuesStored: false, aiReceivedOriginalPrompt: false },
    });
  } catch (error) { return next(error); }
});

// The web app scans in the browser and logs metadata here (signed-in users only).
app.post('/api/scans', requireAuth, async (req, res, next) => {
  try {
    const body = parse(recordScanSchema, req.body, res);
    if (!body) return;
    const record = await saveScan(req.user.id, {
      scanId: crypto.randomUUID(),
      risk: body.risk,
      findings: body.findingTypes,
    });
    return res.status(201).json({ id: record.id });
  } catch (error) { return next(error); }
});

app.get('/api/scans', requireAuth, async (req, res, next) => {
  try {
    res.json({ scans: await listScans(req.user.id) });
  } catch (error) { next(error); }
});

app.delete('/api/scans', requireAuth, async (req, res, next) => {
  try {
    await deleteScans(req.user.id);
    res.status(204).end();
  } catch (error) { next(error); }
});

/* ---- AI assist ---- */

app.post('/api/explain', aiLimiter, async (req, res, next) => {
  try {
    const body = parse(explainSchema, req.body, res);
    if (!body) return;
    const explanation = await explainFindings(body);
    res.json({ explanation, provider: config.geminiApiKey ? 'gemini' : 'local-fallback' });
  } catch (error) { next(error); }
});

app.post('/api/rewrite', aiLimiter, async (req, res, next) => {
  try {
    const body = parse(rewriteSchema, req.body, res);
    if (!body) return;
    // Defence in depth: refuse text that still contains detectable secrets.
    const check = scan(body.redactedPrompt);
    if (check.counts.sensitive > 0) {
      return res.status(422).json({ error: 'This text still contains sensitive values. Redact them before using AI rewrite.' });
    }
    return res.json({ rewrite: await rewritePrompt(body.redactedPrompt, body.lang), provider: 'gemini' });
  } catch (error) { return next(error); }
});

app.use((err, _req, res, _next) => {
  console.error('[api-error]', err?.message || 'Unknown error');
  const status = err?.status && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'An internal server error occurred. Check backend logs for details.' : err.message });
});

app.listen(config.port, () => {
  console.log(`PromptShield API listening on http://localhost:${config.port}`);
  console.log(`Persistence: ${isPersistent ? 'Supabase' : 'in-memory demo mode'} · Gemini: ${config.geminiApiKey ? 'configured' : 'not configured'}`);
});
