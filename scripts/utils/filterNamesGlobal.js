export function filterNamesGlobal(query, searchIndex) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return searchIndex.filter(item => words.every(w => item.nameLower.includes(w)));
}