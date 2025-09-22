import { map_subtitle, save_map } from "./elements.js";

export const addExportControl = async (map, map_title_text) => {
    const svg = await (await fetch('./assets/img/logo/nisra-logo-colour.svg')).text();

    map.addControl(
        new MaplibreExportControl.MaplibreExportControl({
        PageSize: MaplibreExportControl.Size.A5,
        PageOrientation: MaplibreExportControl.PageOrientation.Landscape, // <- must be Portrait to see north icon
        Format: MaplibreExportControl.Format.PNG,
        DPI: MaplibreExportControl.DPI[300],
        Crosshair: false,
        PrintableArea: true,
        Filename: `${map_title_text} (${map_subtitle.textContent})`,
        Local: 'en',
        northIconOptions: {
            image: svg,    
            imageName: 'nisra-north',
            imageSizeFraction: 0.15,
            visibility: 'visible',
            position: 'bottom-right'
        },
        attributionOptions: {
            visibility: "none"
        }
        }),
        'bottom-right'
    );

    const generate_btn = document.querySelector('.generate-button');
    save_map.onclick = function() {
        generate_btn.click()
    }
};