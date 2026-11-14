import { z } from 'zod';

const severity = z.enum(['low', 'medium', 'high', 'critical']);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const scanSchema = z.object({
  prompt: z.string().min(1).max(20000),
  mode: z.enum(['placeholder', 'mask', 'remove']).default('placeholder'),
});

// The browser scans locally and records metadata only: never prompt text or detected values.
export const recordScanSchema = z.object({
  risk: z.object({ level: severity, score: z.number().int().min(0).max(100) }),
  findingTypes: z.array(z.object({
    detector: z.string().max(40),
    severity,
    count: z.number().int().min(0).max(1000),
  })).max(40),
  action: z.enum(['scanned', 'redacted', 'restored']).default('scanned'),
  chars: z.number().int().min(0).max(1_000_000).default(0),
});

export const explainSchema = z.object({
  summary: z.string().max(500),
  risk: z.object({ level: severity, score: z.number().min(0).max(100) }),
  findingTypes: z.array(z.object({
    type: z.string().max(40),
    severity,
    count: z.number().int().min(0).max(1000),
  })).max(40),
  lang: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'es']).default('en'),
});

// Only already-redacted text may be sent here.
export const rewriteSchema = z.object({
  redactedPrompt: z.string().min(1).max(8000),
  lang: z.enum(['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'es']).default('en'),
});
