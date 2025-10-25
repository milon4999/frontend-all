export function buildCacheKey(params) {
  if (!params) return 'default';
  const entries = Object.entries(params)
    .filter(([k, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  const usp = new URLSearchParams(entries);
  return usp.toString() || 'default';
}
