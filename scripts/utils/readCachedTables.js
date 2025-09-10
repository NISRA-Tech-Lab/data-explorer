const TABLES_CACHE_KEY = "nisra:tables:v1";     // bump v1→v2 if schema changes
const TABLES_TTL_MS    = 60 * 60 * 1000;        // 1 hour

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