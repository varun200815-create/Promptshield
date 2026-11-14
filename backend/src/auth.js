import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserById, supabaseGetUser } from './store.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: '7d', issuer: 'promptshield' },
  );
}

export async function verifyBearerToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { issuer: 'promptshield' });
    const stored = await findUserById(payload.sub);
    if (stored) return { id: stored.id, email: stored.email, name: stored.name, provider: 'jwt' };
    if (payload.sub && payload.email) {
      return { id: payload.sub, email: payload.email, name: payload.name || payload.email.split('@')[0], provider: 'jwt' };
    }
  } catch {
    // Not a local JWT; try Supabase Auth token verification next
  }
  const sbUser = await supabaseGetUser(token);
  if (sbUser) return { ...sbUser, provider: 'supabase' };
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const user = await verifyBearerToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid or expired session.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}
