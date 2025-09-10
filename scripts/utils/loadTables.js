// Named export of an async function
import { readCachedTables } from "./readCachedTables.js";
import { writeCachedTables } from "./writeCachedTables.js";

export async function loadTables(url = "data-portal-tables.json") {
  const fresh = readCachedTables(false);
  if (fresh) return fresh;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    writeCachedTables(data);
    return data;
  } catch (e) {
    const stale = readCachedTables(true);
    if (stale) return stale;
    throw e;
  }
}
