import { palette } from "../config.js";

// Use the normalized value (or bin) to pick a color; -1 → grey for NA
export function getColour(normOrBin) {
    if (normOrBin == null || normOrBin < 0) return "#d3d3d3";
    const idx = Math.max(0, Math.min(4, Math.round(normOrBin * 4)));
    return palette[idx];
}