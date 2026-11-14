import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const demoUsers = new Map();
const demoScans = new Map();

export const isPersistent = Boolean(supabase);

export async function supabaseSignUp({ name, email, password }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name } },
    });
    if (error) {
      if (/already registered/i.test(error.message)) {
        const dup = new Error('An account with this email already exists.');
        dup.status = 409;
        throw dup;
      }
      console.warn('[supabase-auth] signUp fallback:', error.message);
      return null;
    }
    if (!data?.user) return null;
    return {
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || name,
        email: data.user.email || email,
      },
      accessToken: data.session?.access_token || null,
    };
  } catch (err) {
    if (err.status === 409) throw err;
    console.warn('[supabase-auth] signUp exception:', err.message);
    return null;
  }
}

export async function supabaseSignIn({ email, password }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) return null;
    return {
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || email.split('@')[0],
        email: data.user.email || email,
      },
      accessToken: data.session?.access_token || null,
    };
  } catch {
    return null;
  }
}

export async function supabaseGetUser(token) {
  if (!supabase || !token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
    };
  } catch {
    return null;
  }
}

export async function findUserByEmail(email) {
  if (!supabase) return [...demoUsers.values()].find(u => u.email === email) || null;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error) {
    console.warn('[supabase-fallback] findUserByEmail:', error.message);
    return [...demoUsers.values()].find(u => u.email === email) || null;
  }
  return data || [...demoUsers.values()].find(u => u.email === email) || null;
}

export async function findUserById(id) {
  if (!supabase) return demoUsers.get(id) || null;
  const { data, error } = await supabase.from('users').select('id,name,email,created_at').eq('id', id).maybeSingle();
  if (error) {
    console.warn('[supabase-fallback] findUserById:', error.message);
    return demoUsers.get(id) || null;
  }
  return data || demoUsers.get(id) || null;
}

export async function createUser(user) {
  demoUsers.set(user.id, user);
  if (!supabase) return user;
  const { data, error } = await supabase.from('users').insert(user).select('id,name,email,created_at').single();
  if (error) {
    console.warn('[supabase-fallback] createUser:', error.message);
    return user;
  }
  return data;
}

export async function saveScan(userId, scan) {
  const safeRecord = {
    id: scan.scanId,
    user_id: userId || null,
    risk_level: scan.risk.level,
    risk_score: scan.risk.score,
    finding_types: scan.findings.map((f) => ({ type: f.detector || f.type, severity: f.severity, count: f.count })),
    created_at: new Date().toISOString(),
  };
  if (!demoScans.has(userId || 'guest')) demoScans.set(userId || 'guest', []);
  demoScans.get(userId || 'guest').unshift(safeRecord);
  if (!supabase || !userId) return safeRecord;
  const { error } = await supabase.from('scans').insert(safeRecord);
  if (error) console.warn('[supabase-fallback] saveScan:', error.message);
  return safeRecord;
}

export async function deleteScans(userId) {
  demoScans.delete(userId || 'guest');
  if (!supabase || !userId) return;
  const { error } = await supabase.from('scans').delete().eq('user_id', userId);
  if (error) console.warn('[supabase-fallback] deleteScans:', error.message);
}

export async function listScans(userId) {
  if (!supabase || !userId) return demoScans.get(userId || 'guest') || [];
  const { data, error } = await supabase.from('scans').select('id,risk_level,risk_score,finding_types,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
  if (error) {
    console.warn('[supabase-fallback] listScans:', error.message);
    return demoScans.get(userId || 'guest') || [];
  }
  return data?.length ? data : (demoScans.get(userId || 'guest') || []);
}
