export function readCachedTables(allowStale = false) {
  try {
    const raw = localStorage.getItem(TABLES_CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!data) return null;
    if (allowStale) return data;
    if (Date.now() - ts < TABLES_TTL_MS) return data;
    return null;
  } catch { return null; }
}