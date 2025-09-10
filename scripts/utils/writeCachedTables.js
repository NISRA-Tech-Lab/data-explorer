export function writeCachedTables(data) {
  try {
    localStorage.setItem(TABLES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* storage may be full or blocked; ignore */ }
}