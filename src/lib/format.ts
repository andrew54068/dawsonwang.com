export function formatViews(n: number): string {
  if (n < 10000) return String(n);
  if (n < 100000) return `${(n / 10000).toFixed(1)} 萬`;
  return `${Math.floor(n / 10000)} 萬`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  // Convert to UTC+8 (Taipei) date
  const taipeiMs = d.getTime() + 8 * 60 * 60 * 1000;
  const taipei = new Date(taipeiMs);
  const yyyy = taipei.getUTCFullYear();
  const mm = String(taipei.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(taipei.getUTCDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}
