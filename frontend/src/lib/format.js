export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'Just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 2) return 'Yesterday';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const formatBytes = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
