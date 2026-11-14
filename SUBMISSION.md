# PROMPTSHIELD AI — Hackathon Submission Pack

## Problem statement
People routinely paste prompts into AI tools that contain personal information, financial identifiers, credentials, or confidential material. They may not recognise the exposure before sharing. PromptShield provides a privacy inspection layer that detects common sensitive patterns and offers a redacted version before onward use.

## Solution description
PromptShield is a React application backed by a Node.js/Express API. A deterministic local rule engine scans prompts for common PII and secret patterns, assigns a transparent risk level, and replaces detected values with typed placeholders. Optional Gemini assistance explains aggregate finding metadata; the original prompt and detected values are not sent to Gemini. JWT authentication, bcrypt password hashing, Zod validation, rate limiting, Helmet, and optional Supabase persistence are included.

## Core features
- Prompt scanning for email addresses, phone numbers, possible bank account numbers, payment-card-like numbers, API-key patterns, JWTs, private-key markers, and IPv4 addresses.
- Risk score and severity categorisation.
- Redacted prompt preview with copy action.
- Optional AI explanation using aggregate finding categories only.
- JWT-based account registration and login.
- Privacy-minimised scan history.
- Responsive dashboard and activity view.

## Limitations to disclose
- Pattern-based scanning is not a certified DLP product. It can produce false positives and miss context-specific secrets.
- The prototype does not intercept traffic inside third-party AI apps; users paste text into PromptShield first.
- Supabase persistence requires the backend-only service-role key and SQL schema setup. Without it, demo-memory mode is used.
- Gemini is optional; the scanner and redaction work without a model key.

## Demo flow (3–5 minutes)
1. Open the dashboard and explain the privacy firewall.
2. Open Scanner and load the built-in sample prompt.
3. Run the scan and show finding categories and risk.
4. Show the redacted prompt and copy it.
5. Click “Explain these findings with AI” to show Gemini explanation if configured, or the local fallback.
6. Register a demo account and show the activity screen.
7. Explain that raw prompt text and detected values are not persisted.

## Submission checklist
- [ ] Public GitHub repository
- [ ] Deployed frontend URL (Vercel)
- [ ] Deployed backend URL (Render)
- [ ] Supabase SQL schema applied (if persistence is enabled)
- [ ] Gemini key configured on backend (optional)
- [ ] 3–5 minute demo video
- [ ] README and this submission summary included
