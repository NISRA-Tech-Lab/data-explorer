import { GEOG_PROPS } from "../config/config.js";

export const shapeCache = new Map();

export async function loadShapes(geog_type) {
  if (shapeCache.has(geog_type)) return shapeCache.get(geog_type);

  const url = GEOG_PROPS[geog_type].url;
  if (!url) throw new Error(`No shape URL for ${geog_type}`);

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const data = await res.json();

  // If you ever switch to .topo.json, this still works:
  const geojson = (data.type === "Topology" && window.topojson)
    ? topojson.feature(data, Object.values(data.objects)[0])
    : data;

  shapeCache.set(geog_type, geojson);
  return geojson;
}
