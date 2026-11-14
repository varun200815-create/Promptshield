import { load, remove, save } from './storage';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => load('token', null);
export const setToken = (token) => (token ? save('token', token) : remove('token'));

async function request(path, { method = 'GET', body, timeout = 20000, auth = true } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method, headers, signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('The server took too long to respond.', 0);
    throw new ApiError('Cannot reach the PromptShield API. Start the backend or check VITE_API_BASE_URL.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request('/health', { timeout: 6000, auth: false }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  recordScan: (body) => request('/scans', { method: 'POST', body }),
  listScans: () => request('/scans'),
  clearScans: () => request('/scans', { method: 'DELETE' }),
  explain: (body) => request('/explain', { method: 'POST', body, timeout: 30000 }),
  rewrite: (body) => request('/rewrite', { method: 'POST', body, timeout: 30000 }),
};
