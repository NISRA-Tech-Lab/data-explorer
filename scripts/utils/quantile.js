// Quintile helper (linear interpolation on sorted values)
export function quantile(sortedVals, p) {
    const n = sortedVals.length;
    if (!n) return null;
    const pos = (n - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sortedVals[base + 1];
    return next !== undefined
        ? sortedVals[base] + rest * (next - sortedVals[base])
        : sortedVals[base];
}