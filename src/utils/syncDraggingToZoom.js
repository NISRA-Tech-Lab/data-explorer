// Toggle dragging based on zoom vs initialZoom

export function syncDraggingToZoom(map, initialZoom) {
    if (map.getZoom() === initialZoom) {
        map.dragging.disable();
        map.getContainer().classList.add("leaflet-drag-disabled");
    } else {
        map.dragging.enable();
        map.getContainer().classList.remove("leaflet-drag-disabled");
    }
}