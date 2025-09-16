export async function addVectorBasemap(leafletMap, styleUrl) {
    const res = await fetch(styleUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load style JSON: ${res.status} ${res.statusText}`);
    const style = await res.json();

    // Patch invalid HSL where hue was mistakenly written with a % (e.g. "hsl(100%, 100%, 100%)")
    style.layers?.forEach(l => {
        const p = l.paint;
        if (!p) return;
        for (const key of Object.keys(p)) {
        const v = p[key];
        if (typeof v === 'string') {
            // fix 'hsl(<number>%, x%, y%)' -> 'hsl(<number>, x%, y%)'
            const fixed = v.replace(/hsl\(\s*([0-9.]+)\s*%\s*,/gi, 'hsl($1,');
            p[key] = fixed === 'hsl(100%, 100%, 100%)' ? '#ffffff' : fixed;
        }
        }
    });

        // Add MapLibre GL layer underneath your GeoJSON layers
    L.maplibreGL({
        style,
        attribution: '© OpenStreetMap | style © ONS'
    }).addTo(leafletMap);

}